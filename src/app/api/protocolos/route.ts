import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// GET /api/protocolos                — lista todos (id, titulo, criado_em)
// GET /api/protocolos?id=X          — retorna protocolo por id (com conteudo)
// GET /api/protocolos?base=TITULO   — busca todas as partes do título base e mescla
export async function GET(request: NextRequest) {
  try {
    const db  = createServiceClient();
    const id  = request.nextUrl.searchParams.get("id");
    const base = request.nextUrl.searchParams.get("base");

    // Detalhe por id simples
    if (id) {
      const { data, error } = await db
        .from("protocolos")
        .select("id, titulo, conteudo, criado_em")
        .eq("id", id)
        .single();

      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ protocolo: data });
    }

    // Mescla todas as partes de um título base
    if (base) {
      // Busca o título exato E todas as partes (titulo LIKE 'base (parte%')
      const { data, error } = await db
        .from("protocolos")
        .select("id, titulo, conteudo, criado_em")
        .or(`titulo.eq.${base},titulo.like.${base} (parte%`)
        .order("titulo", { ascending: true }); // parte 1, 2, 3... ordenam corretamente

      if (error) return Response.json({ error: error.message }, { status: 500 });

      const partes = data ?? [];
      const merged = partes.map((p) => p.conteudo).join("\n\n");

      return Response.json({
        protocolo: {
          id:        partes[0]?.id,
          titulo:    base,
          conteudo:  merged,
          criado_em: partes[0]?.criado_em,
          partes:    partes.length,
        },
      });
    }

    // Listagem completa
    const { data, error } = await db
      .from("protocolos")
      .select("id, titulo, criado_em")
      .order("criado_em", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ protocolos: data ?? [] });
  } catch (err) {
    console.error("[protocolos] GET error:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/protocolos — exclui um protocolo pelo id (body: { id: number })
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "id é obrigatório" }, { status: 400 });

    const db = createServiceClient();
    const { error } = await db.from("protocolos").delete().eq("id", id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[protocolos] DELETE error:", err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}
