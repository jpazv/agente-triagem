import path from "path";
import { pathToFileURL } from "url";
import { NextRequest } from "next/server";
import { PDFParse } from "pdf-parse";
import { createServiceClient } from "@/lib/supabase";

// Point pdfjs to its Node.js worker file so worker threads can spawn correctly.
PDFParse.setWorker(
  pathToFileURL(
    path.resolve(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  ).href
);

const MAX_CHUNK_CHARS = 6000;
const OVERLAP_CHARS   = 200;

/**
 * Divide texto longo em chunks com overlap para preservar contexto entre partes.
 * Cada chunk vira um protocolo separado no Supabase.
 */
function chunkText(texto: string): string[] {
  if (texto.length <= MAX_CHUNK_CHARS) return [texto];

  const chunks: string[] = [];
  let pos = 0;

  while (pos < texto.length) {
    const end = Math.min(pos + MAX_CHUNK_CHARS, texto.length);
    chunks.push(texto.slice(pos, end).trim());
    pos += MAX_CHUNK_CHARS - OVERLAP_CHARS;
  }

  return chunks.filter((c) => c.length > 100); // descarta fragmentos minúsculos
}

// POST /api/ingest-pdf
// Recebe multipart/form-data com: file (PDF), titulo (string)
// Extrai texto do PDF, fragmenta se necessário e persiste no Supabase.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    const titulo   = (formData.get("titulo") as string | null)?.trim();

    if (!file || !titulo) {
      return Response.json(
        { error: "file e titulo são obrigatórios" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return Response.json(
        { error: "Apenas arquivos PDF são aceitos" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    let textResult: Awaited<ReturnType<PDFParse["getText"]>>;
    try {
      textResult = await parser.getText();
    } catch (pdfErr) {
      console.error("[ingest-pdf] PDF parse error:", pdfErr);
      return Response.json(
        { error: "Não foi possível ler o PDF. Verifique se o arquivo não está protegido por senha." },
        { status: 422 }
      );
    } finally {
      await parser.destroy();
    }

    const texto = textResult!.text.replace(/\s+/g, " ").trim();

    if (texto.length < 50) {
      return Response.json(
        { error: "PDF sem conteúdo textual legível (pode ser um PDF de imagens/scan)." },
        { status: 422 }
      );
    }

    const chunks  = chunkText(texto);
    const db      = createServiceClient();
    const total   = chunks.length;

    const rows = chunks.map((conteudo, i) => ({
      titulo: total > 1 ? `${titulo} (parte ${i + 1}/${total})` : titulo,
      conteudo,
    }));

    const { error } = await db.from("protocolos").insert(rows);

    if (error) {
      console.error("[ingest-pdf] Supabase insert error:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      success:   true,
      titulo,
      paginas:   textResult!.total,
      caracteres: texto.length,
      partes:    total,
    });
  } catch (err) {
    console.error("[ingest-pdf] Unexpected error:", err);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
