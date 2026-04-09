import { createServiceClient } from "@/lib/supabase";

const REGEX_URGENCIA = /Nível de urgência:\s*(BAIXA|MÉDIA|ALTA|MEDIA)/i;

function extrairUrgencia(conteudo: string): string | null {
  const m = conteudo.match(REGEX_URGENCIA);
  if (!m) return null;
  return m[1].toUpperCase().replace("MEDIA", "MÉDIA");
}

// GET /api/dashboard
// Retorna todas as sessões agrupadas com urgência, contagem e primeira mensagem.
export async function GET() {
  try {
    const db = createServiceClient();

    const { data: mensagens, error } = await db
      .from("conversas")
      .select("sessao_id, role, conteudo, criado_em")
      .order("criado_em", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Agrupa por sessao_id
    const sessoesMap = new Map<string, {
      sessao_id: string;
      criado_em: string;
      total_mensagens: number;
      primeira_mensagem: string;
      urgencia: string | null;
    }>();

    for (const msg of mensagens ?? []) {
      if (!sessoesMap.has(msg.sessao_id)) {
        sessoesMap.set(msg.sessao_id, {
          sessao_id:        msg.sessao_id,
          criado_em:        msg.criado_em,
          total_mensagens:  0,
          primeira_mensagem: "",
          urgencia:         null,
        });
      }

      const sessao = sessoesMap.get(msg.sessao_id)!;
      sessao.total_mensagens += 1;

      if (msg.role === "user" && !sessao.primeira_mensagem) {
        sessao.primeira_mensagem = msg.conteudo;
      }

      if (msg.role === "assistant" && !sessao.urgencia) {
        sessao.urgencia = extrairUrgencia(msg.conteudo);
      }
    }

    const sessoes = Array.from(sessoesMap.values()).reverse(); // mais recentes primeiro

    // Stats gerais
    const stats = {
      total:  sessoes.length,
      alta:   sessoes.filter((s) => s.urgencia === "ALTA").length,
      media:  sessoes.filter((s) => s.urgencia === "MÉDIA").length,
      baixa:  sessoes.filter((s) => s.urgencia === "BAIXA").length,
      sem:    sessoes.filter((s) => !s.urgencia).length,
    };

    return Response.json({ sessoes, stats });
  } catch (err) {
    console.error("[dashboard] error:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
