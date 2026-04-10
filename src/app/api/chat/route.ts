import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { groq, GROQ_MODEL, SYSTEM_PROMPT } from "@/lib/anthropic";

type Urgencia = "BAIXA" | "MÉDIA" | "ALTA";

interface TriagemResultado {
  urgencia: Urgencia;
  recomendacao: string;
  motivo: string;
}

function parsearResposta(texto: string): { conversacional: string; triagem: TriagemResultado | null } {
  const sepIdx = texto.indexOf("---");
  if (sepIdx === -1) return { conversacional: texto.trim(), triagem: null };

  const conversacional = texto.slice(0, sepIdx).trim();
  const bloco = texto.slice(sepIdx);

  const urgenciaMatch = bloco.match(/Nível de urgência:\s*(BAIXA|MÉDIA|ALTA|MEDIA)/i);
  const recomendacaoMatch = bloco.match(/Recomendação:\s*(.+)/i);
  const motivoMatch = bloco.match(/Motivo:\s*(.+)/i);

  if (!urgenciaMatch) return { conversacional: texto.trim(), triagem: null };

  return {
    conversacional,
    triagem: {
      urgencia: urgenciaMatch[1].toUpperCase().replace("MEDIA", "MÉDIA") as Urgencia,
      recomendacao: recomendacaoMatch?.[1]?.trim() ?? "",
      motivo: motivoMatch?.[1]?.trim() ?? "",
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mensagem, sessao_id } = body as { mensagem: string; sessao_id: string };

    if (!mensagem || !sessao_id) {
      return Response.json({ error: "mensagem e sessao_id são obrigatórios" }, { status: 400 });
    }

    const db = createServiceClient();

    // RAG: busca protocolos relevantes
    const { data: protocolos } = await db.rpc("match_protocolos", {
      query_text: mensagem,
      match_count: 3,
    });

    const protoclosTitulos: string[] = protocolos?.map((p: { titulo: string }) => p.titulo) ?? [];

    const contextoProtocolos =
      protocolos && protocolos.length > 0
        ? protocolos.map((p: { titulo: string; conteudo: string }) => `## ${p.titulo}\n${p.conteudo}`).join("\n\n")
        : "Nenhum protocolo específico encontrado. Use conhecimento geral de fisioterapia.";

    // Busca histórico
    const { data: historico } = await db
      .from("conversas")
      .select("role, conteudo")
      .eq("sessao_id", sessao_id)
      .order("criado_em", { ascending: true })
      .limit(20);

    // Salva mensagem do usuário ANTES de chamar o Groq
    await db.from("conversas").insert([
      { sessao_id, role: "user", conteudo: mensagem },
    ]);

    // Protocolos vão no system prompt — mensagem do usuário fica limpa
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT}\n\n[PROTOCOLOS CLÍNICOS DISPONÍVEIS]\n${contextoProtocolos}`,
      },
    ];

    if (historico) {
      for (const msg of historico) {
        messages.push({ role: msg.role as "user" | "assistant", content: msg.conteudo });
      }
    }

    // Mensagem do usuário limpa
    messages.push({
      role: "user",
      content: mensagem,
    });

    // Streaming da resposta do Groq via SSE
    const groqStream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 1024,
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullContent = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (!token) continue;

            fullContent += token;

            const jaTemSeparador = fullContent.includes("---");
            if (!jaTemSeparador) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)
              );
            }
          }

          // Stream concluído — parseia e salva só o assistant
          const { conversacional, triagem } = parsearResposta(fullContent);

          await db.from("conversas").insert([
            { sessao_id, role: "assistant", conteudo: fullContent },
          ]);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                conversacional,
                triagem,
                protocolos: protoclosTitulos,
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("[chat] Unexpected error:", err);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}