import { NextRequest } from "next/server";

// POST /api/upload
// Recebe uma imagem do chat e encaminha para o webhook do n8n processar.
// O n8n pode fazer OCR, análise de exame, triagem por imagem, etc.
export async function POST(request: NextRequest) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      return Response.json(
        { error: "N8N_WEBHOOK_URL não configurado" },
        { status: 503 }
      );
    }

    // Repassa o FormData com a imagem diretamente para o n8n
    const formData = await request.formData();

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!n8nResponse.ok) {
      return Response.json(
        { error: "Erro ao processar imagem no n8n" },
        { status: 502 }
      );
    }

    const result = await n8nResponse.json().catch(() => ({
      mensagem: "Imagem recebida e enviada para análise.",
    }));

    return Response.json({ mensagem: result.mensagem ?? "Imagem enviada para análise." });
  } catch (err) {
    console.error("[upload] Unexpected error:", err);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
