"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const COR_VERDE   = "#134F47";
const COR_LARANJA = "#f47920";

// ─── Logo ─────────────────────────────────────────────────────────────────────

function LogoAlivia() {
  const c   = COR_VERDE;
  const sub = "rgba(19,79,71,0.45)";
  return (
    <div className="flex items-center gap-2 select-none">
      <svg viewBox="0 0 24 38" className="w-4 h-6 flex-shrink-0" fill="none">
        <rect x="5" y="0" width="14" height="8" rx="2.5" fill={c} opacity="0.65" />
        <rect x="2" y="11" width="20" height="8" rx="2.5" fill={c} />
        <rect x="5" y="22" width="14" height="8" rx="2.5" fill={c} opacity="0.65" />
        <line x1="12" y1="8"  x2="12" y2="11"   stroke={sub} strokeWidth="1.5" />
        <line x1="12" y1="19" x2="12" y2="22"   stroke={sub} strokeWidth="1.5" />
        <circle cx="12" cy="34" r="2.5" fill={c} opacity="0.4" />
        <line x1="12" y1="30" x2="12" y2="31.5" stroke={sub} strokeWidth="1.5" />
      </svg>
      <div className="flex flex-col leading-none gap-0.5">
        <span className="text-base font-bold tracking-tight" style={{ color: c }}>alivia</span>
        <span className="text-[8px] font-semibold tracking-[0.2em] uppercase" style={{ color: sub }}>by jpazv</span>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgencia = "ALTA" | "MÉDIA" | "BAIXA" | null;
type FiltroUrgencia = "TODAS" | "ALTA" | "MÉDIA" | "BAIXA" | "SEM_TRIAGEM";

interface Sessao {
  sessao_id:         string;
  criado_em:         string;
  total_mensagens:   number;
  primeira_mensagem: string;
  urgencia:          string | null;
}

interface Stats {
  total: number;
  alta:  number;
  media: number;
  baixa: number;
  sem:   number;
}

const URGENCIA_STYLE: Record<string, { badge: string; dot: string }> = {
  ALTA:  { badge: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-500"     },
  MÉDIA: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500"   },
  BAIXA: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function buildTriagensPorDia(sessoes: Sessao[]) {
  const map = new Map<string, number>();
  for (const s of sessoes) {
    const d = new Date(s.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([data, total]) => ({ data, total }))
    .slice(-14);
}

function buildUrgenciaDist(stats: Stats) {
  return [
    { name: "Alta",       value: stats.alta,  color: "#dc2626" },
    { name: "Média",      value: stats.media, color: "#d97706" },
    { name: "Baixa",      value: stats.baixa, color: "#059669" },
    { name: "Sem triagem",value: stats.sem,   color: "#94a3b8" },
  ].filter((d) => d.value > 0);
}

function buildMsgsPorSessao(sessoes: Sessao[]) {
  return sessoes.slice(0, 10).map((s) => ({
    id: s.sessao_id.slice(0, 6),
    msgs: s.total_mensagens,
    urg: s.urgencia ?? "—",
  }));
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, valor, sub, cor, bg, icon }: {
  label: string; valor: number; sub: string; cor: string; bg: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color: cor }}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold tabular-nums" style={{ color: cor }}>{valor}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-gray-900">{payload[0].value} triagens</p>
    </div>
  );
}

// ─── Painel de Protocolos ─────────────────────────────────────────────────────

interface Protocolo { id: number; titulo: string; criado_em: string; }
interface ProtocoloDetalhe extends Protocolo { conteudo: string; partes?: number; }
interface ProtocoloAgrupado { id: number; baseTitulo: string; criado_em: string; partes: number; }

const PARTE_REGEX = /^(.+?) \(parte \d+\/\d+\)$/;

function agruparProtocolos(lista: Protocolo[]): ProtocoloAgrupado[] {
  const map = new Map<string, ProtocoloAgrupado>();
  for (const p of lista) {
    const match = PARTE_REGEX.exec(p.titulo);
    const base  = match ? match[1] : p.titulo;
    if (!map.has(base)) map.set(base, { id: p.id, baseTitulo: base, criado_em: p.criado_em, partes: 0 });
    map.get(base)!.partes += 1;
  }
  return Array.from(map.values());
}

function ModalProtocolo({ protocolo, onClose }: { protocolo: ProtocoloDetalhe; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#134F4718", color: COR_VERDE }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{protocolo.titulo}</h2>
              {protocolo.criado_em && <p className="text-xs text-gray-400 mt-0.5">{formatarData(protocolo.criado_em)}</p>}
            </div>
          </div>
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{protocolo.conteudo}</pre>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {protocolo.conteudo.length.toLocaleString("pt-BR")} caracteres
            {protocolo.partes && protocolo.partes > 1 && ` · ${protocolo.partes} partes mescladas`}
          </span>
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
}

function PainelProtocolos() {
  const [protocolos, setProtocolos]       = useState<Protocolo[]>([]);
  const [loading, setLoading]             = useState(true);
  const [deletando, setDeletando]         = useState<string | null>(null);
  const [visualizando, setVisualizando]   = useState<ProtocoloDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    try { const res = await fetch("/api/protocolos"); const d = await res.json(); setProtocolos(d.protocolos ?? []); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  const agrupados = agruparProtocolos(protocolos);

  async function abrirDetalhe(g: ProtocoloAgrupado) {
    setLoadingDetalhe(g.baseTitulo);
    try {
      const url = g.partes > 1 ? `/api/protocolos?base=${encodeURIComponent(g.baseTitulo)}` : `/api/protocolos?id=${g.id}`;
      const res = await fetch(url); const d = await res.json(); setVisualizando(d.protocolo);
    } finally { setLoadingDetalhe(null); }
  }

  async function excluir(e: React.MouseEvent, g: ProtocoloAgrupado) {
    e.stopPropagation();
    if (!confirm(`Excluir "${g.baseTitulo}"?`)) return;
    setDeletando(g.baseTitulo);
    try {
      const ids = protocolos.filter((p) => { const m = PARTE_REGEX.exec(p.titulo); return m ? m[1] === g.baseTitulo : p.titulo === g.baseTitulo; }).map((p) => p.id);
      await Promise.all(ids.map((id) => fetch("/api/protocolos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })));
      setProtocolos((prev) => prev.filter((p) => !ids.includes(p.id)));
    } finally { setDeletando(null); }
  }

  return (
    <>
      {visualizando && <ModalProtocolo protocolo={visualizando} onClose={() => setVisualizando(null)} />}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800">Base de Conhecimento</h3>
            <p className="text-xs text-gray-400 mt-0.5">{loading ? "Carregando..." : `${agrupados.length} protocolos · ${protocolos.length} partes`}</p>
          </div>
          <button onClick={carregar} className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Atualizar
          </button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center p-12"><div className="flex gap-1">{[0,150,300].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>
        ) : agrupados.length === 0 ? (
          <div className="p-12 text-center"><p className="text-gray-400 text-sm">Nenhum protocolo ainda.</p><p className="text-xs text-gray-300 mt-1">Use a aba "Ingerir Protocolo" para adicionar.</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingerido em</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {agrupados.map((g) => (
                <tr key={g.baseTitulo} onClick={() => abrirDetalhe(g)} className="hover:bg-gray-50/70 transition-colors group cursor-pointer">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#134F4718" }}>
                        {loadingDetalhe === g.baseTitulo
                          ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" style={{ color: COR_VERDE }}><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ color: COR_VERDE }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-800 font-medium truncate max-w-xs group-hover:text-[#134F47] transition-colors">{g.baseTitulo}</span>
                        {g.partes > 1 && <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: "#134F4714", color: COR_VERDE }}>{g.partes} partes</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{formatarData(g.criado_em)}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={(e) => excluir(e, g)} disabled={deletando === g.baseTitulo} className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-30">
                      {deletando === g.baseTitulo ? "..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ─── Painel de Ingestão ───────────────────────────────────────────────────────

type IngestStatus = "idle" | "loading" | "ok" | "erro";
interface IngestResult { paginas?: number; caracteres?: number; partes?: number; }

function PainelIngestao() {
  const [aba, setAba]             = useState<"texto" | "pdf">("pdf");
  const [titulo, setTitulo]       = useState("");
  const [conteudo, setConteudo]   = useState("");
  const [pdfTitulo, setPdfTitulo] = useState("");
  const [pdfFile, setPdfFile]     = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [status, setStatus]       = useState<IngestStatus>("idle");
  const [mensagem, setMensagem]   = useState("");
  const [result, setResult]       = useState<IngestResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetStatus() { setStatus("idle"); setMensagem(""); setResult(null); }

  async function ingerirTexto() {
    if (!titulo.trim() || !conteudo.trim()) return;
    setStatus("loading"); setResult(null);
    try {
      const res = await fetch("/api/ingest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: titulo.trim(), conteudo: conteudo.trim() }) });
      const data = await res.json();
      if (res.ok) { setStatus("ok"); setMensagem(`"${titulo}" ingerido.`); setTitulo(""); setConteudo(""); }
      else { setStatus("erro"); setMensagem(data.error ?? "Erro desconhecido."); }
    } catch { setStatus("erro"); setMensagem("Erro de conexão."); }
  }

  async function ingerirPdf() {
    if (!pdfFile || !pdfTitulo.trim()) return;
    setStatus("loading"); setResult(null);
    try {
      const form = new FormData(); form.append("file", pdfFile); form.append("titulo", pdfTitulo.trim());
      const res = await fetch("/api/ingest-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) { setStatus("ok"); setMensagem(`"${pdfTitulo}" ingerido.`); setResult({ paginas: data.paginas, caracteres: data.caracteres, partes: data.partes }); setPdfFile(null); setPdfTitulo(""); }
      else { setStatus("erro"); setMensagem(data.error ?? "Erro desconhecido."); }
    } catch { setStatus("erro"); setMensagem("Erro de conexão."); }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0]; if (!file) return;
    if (file.type !== "application/pdf") { setStatus("erro"); setMensagem("Apenas PDFs são aceitos."); return; }
    resetStatus(); setPdfFile(file);
    if (!pdfTitulo) setPdfTitulo(file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
  }, [pdfTitulo]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    resetStatus(); setPdfFile(file);
    if (!pdfTitulo) setPdfTitulo(file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ background: COR_VERDE }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </span>
        <div>
          <h3 className="font-semibold text-gray-800">Ingerir Protocolo Clínico</h3>
          <p className="text-xs text-gray-400">Adicione protocolos à base de conhecimento da Clara via PDF ou texto</p>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
        {(["pdf", "texto"] as const).map((a) => (
          <button key={a} onClick={() => { setAba(a); resetStatus(); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${aba === a ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {a === "pdf" ? "📎 Upload PDF" : "✏️ Colar texto"}
          </button>
        ))}
      </div>

      {aba === "pdf" && (
        <div className="space-y-4">
          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging ? "border-[#134F47] bg-[#134F47]/5" : pdfFile ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-[#134F47]/40 hover:bg-gray-50"}`}>
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
            {pdfFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg>
                </div>
                <p className="font-semibold text-sm text-gray-800">{pdfFile.name}</p>
                <p className="text-xs text-gray-400">{(pdfFile.size / 1024).toFixed(0)} KB · clique para trocar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <div><p className="text-sm font-medium text-gray-600">Arraste o PDF aqui</p><p className="text-xs text-gray-400 mt-0.5">ou clique para selecionar · máx. 10 MB</p></div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título do protocolo</label>
            <input value={pdfTitulo} onChange={(e) => setPdfTitulo(e.target.value)} placeholder="ex: Protocolo de Dor Lombar Crônica" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#134F47]/40 focus:ring-2 focus:ring-[#134F47]/10 transition-all" />
          </div>
          <button onClick={ingerirPdf} disabled={!pdfFile || !pdfTitulo.trim() || status === "loading"} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: COR_VERDE }}>
            {status === "loading" ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Extraindo...</> : "Ingerir PDF"}
          </button>
        </div>
      )}

      {aba === "texto" && (
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Título</label><input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="ex: Protocolo de Dor Cervical Aguda" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#134F47]/40 focus:ring-2 focus:ring-[#134F47]/10 transition-all" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Conteúdo</label><textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} placeholder="Cole o texto do protocolo..." rows={7} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#134F47]/40 focus:ring-2 focus:ring-[#134F47]/10 transition-all resize-none" /></div>
          <button onClick={ingerirTexto} disabled={!titulo.trim() || !conteudo.trim() || status === "loading"} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40" style={{ background: COR_VERDE }}>
            {status === "loading" ? "Ingerindo..." : "Ingerir protocolo"}
          </button>
        </div>
      )}

      {status === "ok" && (
        <div className="mt-4 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-1">
          <p className="font-semibold">✓ {mensagem}</p>
          {result && <div className="flex gap-4 text-emerald-600 pt-1">{result.paginas && <span>📄 {result.paginas} págs.</span>}{result.caracteres && <span>🔤 {result.caracteres.toLocaleString("pt-BR")} chars</span>}{result.partes && result.partes > 1 && <span>✂️ {result.partes} partes</span>}</div>}
        </div>
      )}
      {status === "erro" && <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">✗ {mensagem}</p>}
    </div>
  );
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [sessoes, setSessoes]   = useState<Sessao[]>([]);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [filtro, setFiltro]     = useState<FiltroUrgencia>("TODAS");
  const [loading, setLoading]   = useState(true);
  const [abaSel, setAbaSel]     = useState<"overview" | "triagens" | "protocolos" | "ingestao">("overview");
  const [busca, setBusca]       = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => { setSessoes(data.sessoes ?? []); setStats(data.stats ?? null); })
      .finally(() => setLoading(false));
  }, []);

  const sessoesFiltradas = sessoes.filter((s) => {
    const passaFiltro = filtro === "TODAS" ? true : filtro === "SEM_TRIAGEM" ? !s.urgencia : s.urgencia === filtro;
    if (!passaFiltro) return false;
    if (!busca.trim()) return true;
    return s.primeira_mensagem?.toLowerCase().includes(busca.toLowerCase());
  });

  const triagensPorDia  = buildTriagensPorDia(sessoes);
  const urgenciaDist    = stats ? buildUrgenciaDist(stats) : [];
  const msgsPorSessao   = buildMsgsPorSessao(sessoes);

  const STAT_CARDS = stats ? [
    { label: "Total de triagens", valor: stats.total, sub: "sessões registradas",       cor: COR_VERDE,  bg: "#eef7f5",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { label: "Urgência ALTA",     valor: stats.alta,  sub: "atenção imediata",           cor: "#dc2626",  bg: "#fef2f2",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
    { label: "Urgência MÉDIA",    valor: stats.media, sub: "consulta em breve",          cor: "#d97706",  bg: "#fffbeb",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: "Urgência BAIXA",    valor: stats.baixa, sub: "situação estável",           cor: "#059669",  bg: "#f0fdf4",
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: "#f4f6f5" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <LogoAlivia />
          <div className="hidden md:block w-px h-5 bg-gray-200" />
          <span className="hidden md:block text-sm font-medium text-gray-500">Painel do Gestor</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            IA Ativa
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#134F47]/10 text-[#134F47]">
            Clara online
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── Título ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Visão geral das triagens realizadas pela Clara</p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STAT_CARDS.map((card) => <StatCard key={card.label} {...card} />)}
          </div>
        )}

        {/* ── Abas ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {(["overview", "triagens", "protocolos", "ingestao"] as const).map((aba) => (
            <button key={aba} onClick={() => setAbaSel(aba)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${abaSel === aba ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {aba === "overview" ? "Visão Geral" : aba === "triagens" ? "Triagens" : aba === "protocolos" ? "Protocolos" : "Ingerir"}
            </button>
          ))}
        </div>

        {/* ══════════════════ ABA: OVERVIEW ══════════════════ */}
        {abaSel === "overview" && (
          <div className="space-y-6">

            {/* Charts row */}
            <div className="grid md:grid-cols-3 gap-6">

              {/* Area chart — triagens por dia */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800">Triagens por dia</h3>
                  <p className="text-xs text-gray-400">Últimos 14 dias</p>
                </div>
                {triagensPorDia.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sem dados suficientes</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={triagensPorDia} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradVerde" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={COR_VERDE} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={COR_VERDE} stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="total" stroke={COR_VERDE} strokeWidth={2} fill="url(#gradVerde)" dot={{ fill: COR_VERDE, r: 3 }} activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie chart — distribuição de urgência */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800">Urgência</h3>
                  <p className="text-xs text-gray-400">Distribuição total</p>
                </div>
                {urgenciaDist.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={urgenciaDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                          {urgenciaDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} triagens`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {urgenciaDist.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-gray-600">{d.name}</span></div>
                          <span className="font-semibold text-gray-800">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bar chart — mensagens por sessão */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800">Mensagens por sessão</h3>
                <p className="text-xs text-gray-400">10 sessões mais recentes</p>
              </div>
              {msgsPorSessao.length === 0 ? (
                <div className="h-36 flex items-center justify-center text-sm text-gray-400">Sem dados</div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={msgsPorSessao} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="id" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${v} mensagens`]} />
                    <Bar dataKey="msgs" fill={COR_LARANJA} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Últimas triagens resumidas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Últimas triagens</h3>
              </div>
              {loading ? (
                <div className="p-8 flex justify-center"><div className="flex gap-1">{[0,150,300].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>
              ) : (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {sessoes.slice(0, 5).map((s) => {
                      const urg = s.urgencia as Urgencia;
                      const style = urg ? URGENCIA_STYLE[urg] : null;
                      return (
                        <tr key={s.sessao_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">{formatarData(s.criado_em)}</td>
                          <td className="px-5 py-3 text-gray-700 truncate max-w-xs">{s.primeira_mensagem || <span className="text-gray-300 italic">—</span>}</td>
                          <td className="px-5 py-3">
                            {style ? <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${style.badge}`}><span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />{urg}</span> : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-400">{s.total_mensagens} msg</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════ ABA: TRIAGENS ══════════════════ */}
        {abaSel === "triagens" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative max-w-sm flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por mensagem..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-[#134F47]/40 focus:ring-2 focus:ring-[#134F47]/10 transition-all" />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["TODAS", "ALTA", "MÉDIA", "BAIXA", "SEM_TRIAGEM"] as FiltroUrgencia[]).map((f) => (
                  <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filtro === f ? "border-[#134F47] bg-[#134F47] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                    {f === "SEM_TRIAGEM" ? "Sem triagem" : f === "TODAS" ? "Todas" : `${f}`}
                    {stats && <span className={`ml-1.5 ${filtro === f ? "text-white/70" : "text-gray-400"}`}>({f === "TODAS" ? stats.total : f === "ALTA" ? stats.alta : f === "MÉDIA" ? stats.media : f === "BAIXA" ? stats.baixa : stats.sem})</span>}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex justify-center"><div className="flex gap-1">{[0,150,300].map((d) => <span key={d} className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div></div>
            ) : sessoesFiltradas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"><p className="text-gray-400 text-sm">Nenhuma triagem encontrada</p></div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Primeira mensagem</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Urgência</th><th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Msgs</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessoesFiltradas.map((s) => {
                      const urg = s.urgencia as Urgencia;
                      const style = urg ? URGENCIA_STYLE[urg] : null;
                      return (
                        <tr key={s.sessao_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{formatarData(s.criado_em)}</td>
                          <td className="px-5 py-4 text-gray-800 truncate max-w-xs">{s.primeira_mensagem || <span className="text-gray-400 italic">—</span>}</td>
                          <td className="px-5 py-4">{style ? <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.badge}`}><span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />{urg}</span> : <span className="text-gray-400 text-xs">—</span>}</td>
                          <td className="px-5 py-4"><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{s.total_mensagens}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ABA: PROTOCOLOS ══════════════════ */}
        {abaSel === "protocolos" && <PainelProtocolos />}

        {/* ══════════════════ ABA: INGERIR ══════════════════ */}
        {abaSel === "ingestao" && <PainelIngestao />}

      </div>
    </div>
  );
}
