import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// POST /api/ingest
// Recebe um protocolo clínico e persiste no Supabase.
// A busca usa full-text search do PostgreSQL, sem necessidade de embeddings.
// Chamado pelo pipeline n8n durante a fase de ingestão de documentos.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, conteudo } = body as { titulo: string; conteudo: string };

    if (!titulo || !conteudo) {
      return Response.json(
        { error: "titulo e conteudo são obrigatórios" },
        { status: 400 }
      );
    }

    const db = createServiceClient();
    const { error } = await db.from("protocolos").insert({ titulo, conteudo });

    if (error) {
      console.error("[ingest] Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, titulo });
  } catch (err) {
    console.error("[ingest] Unexpected error:", err);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
