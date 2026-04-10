"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────

type Urgencia = "BAIXA" | "MÉDIA" | "ALTA" | null;

interface AgendamentoInfo {
  nome: string;
  data: string;
  periodo: string;
}

interface TriagemResultado {
  urgencia: NonNullable<Urgencia>;
  recomendacao: string;
  motivo: string;
}

interface Mensagem {
  role: "user" | "assistant";
  conteudo: string;
  urgencia?: Urgencia;
  agendamento?: AgendamentoInfo;
  triagem?: TriagemResultado;
  protocolos?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COR_VERDE = "#134F47";
const COR_LARANJA = "#f47920";

const REGEX_AGENDAMENTO = /Consulta agendada para (.+?) no dia (.+?) à (.+?)\. Até lá/i;

const TRIAGEM_DECISAO: Record<NonNullable<Urgencia>, {
  titulo: string; descricao: string; cta: string; ctaAcao: string;
  fundo: string; borda: string; corTexto: string; corCta: string; icone: string;
}> = {
  ALTA: {
    titulo: "Atenção imediata necessária",
    descricao: "Seus sintomas indicam situação que requer avaliação médica urgente.",
    cta: "Buscar pronto-socorro agora", ctaAcao: "pronto-socorro",
    fundo: "bg-red-50", borda: "border-red-200", corTexto: "text-red-800",
    corCta: "bg-red-600 hover:bg-red-700 text-white", icone: "🚨",
  },
  MÉDIA: {
    titulo: "Consulta recomendada em breve",
    descricao: "Seus sintomas merecem atenção especializada nos próximos dias.",
    cta: "Agendar consulta agora", ctaAcao: "agendar",
    fundo: "bg-amber-50", borda: "border-amber-200", corTexto: "text-amber-800",
    corCta: "bg-amber-500 hover:bg-amber-600 text-white", icone: "⚠️",
  },
  BAIXA: {
    titulo: "Situação sob controle",
    descricao: "Seus sintomas são manejáveis. Agende quando for conveniente.",
    cta: "Agendar consulta", ctaAcao: "agendar",
    fundo: "bg-emerald-50", borda: "border-emerald-200", corTexto: "text-emerald-800",
    corCta: "bg-[#134F47] hover:bg-[#0f3d36] text-white", icone: "✅",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectarAgendamento(texto: string): AgendamentoInfo | null {
  const m = texto.match(REGEX_AGENDAMENTO);
  if (!m) return null;
  return { nome: m[1].trim(), data: m[2].trim(), periodo: m[3].trim() };
}

// ─── Logo Alivia ─────────────────────────────────────────────────────────────

function LogoAlivia({ dark = false, size = "md" }: { dark?: boolean; size?: "sm" | "md" | "lg" }) {
  const c = dark ? "white" : COR_VERDE;
  const sub = dark ? "rgba(255,255,255,0.35)" : "rgba(19,79,71,0.45)";
  const sizes = {
    sm: { mark: "w-4 h-6", name: "text-base", tag: "text-[8px]" },
    md: { mark: "w-5 h-8", name: "text-xl", tag: "text-[9px]" },
    lg: { mark: "w-8 h-12", name: "text-3xl", tag: "text-[11px]" }
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Vertebrae mark */}
      <svg viewBox="0 0 24 38" className={`${s.mark} flex-shrink-0`} fill="none">
        <rect x="5" y="0" width="14" height="8" rx="2.5" fill={c} opacity="0.65" />
        <rect x="2" y="11" width="20" height="8" rx="2.5" fill={c} />
        <rect x="5" y="22" width="14" height="8" rx="2.5" fill={c} opacity="0.65" />
        <line x1="12" y1="8" x2="12" y2="11" stroke={sub} strokeWidth="1.5" />
        <line x1="12" y1="19" x2="12" y2="22" stroke={sub} strokeWidth="1.5" />
        <circle cx="12" cy="34" r="2.5" fill={c} opacity="0.4" />
        <line x1="12" y1="30" x2="12" y2="31.5" stroke={sub} strokeWidth="1.5" />
      </svg>
      {/* Text */}
      <div className="flex flex-col leading-none gap-1">
        <span className={`${s.name} font-bold tracking-tight`} style={{ color: c }}>alivia</span>
        <span className={`${s.tag} font-semibold tracking-[0.2em] uppercase`} style={{ color: sub }}>by jpazv</span>
      </div>
    </div>
  );
}

// ─── ScrollDownButton ────────────────────────────────────────────────────────

function ScrollDownButton({ targetId, label, dark = false }: {
  targetId: string; label: string; dark?: boolean;
}) {
  function handleClick() {
    const el = document.getElementById(targetId);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`flex flex-col items-center gap-2 group ${dark ? "text-white/40 hover:text-white/80" : "text-gray-400 hover:text-gray-700"} transition-colors`}
      whileHover={{ y: 2 }}
      aria-label={`Ir para ${label}`}
    >
      <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className={`w-8 h-8 rounded-full border flex items-center justify-center group-hover:scale-110 transition-transform ${dark ? "border-white/20 group-hover:border-white/50" : "border-gray-200 group-hover:border-gray-400"
          }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.div>
    </motion.button>
  );
}

// ─── AnimatedCounter ─────────────────────────────────────────────────────────

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-60px" });

  useEffect(() => {
    const node = nodeRef.current;
    if (!inView || !node) return;
    const duration = 1600;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (node) node.textContent = Math.round(eased * to) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, to, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
}

// ─── Chat Components ──────────────────────────────────────────────────────────

function CardTriagem({ triagem, mensagemHumana, onAgendar }: {
  triagem: TriagemResultado; mensagemHumana: string; onAgendar: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const cfg = TRIAGEM_DECISAO[triagem.urgencia];

  function handleCta() {
    if (cfg.ctaAcao === "agendar") { onAgendar(); return; }
    window.open("https://www.google.com/maps/search/pronto+socorro+perto+de+mim", "_blank");
  }

  return (
    <div className={`rounded-2xl border ${cfg.fundo} ${cfg.borda} p-3.5 shadow-sm w-full`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{cfg.icone}</span>
        <p className={`font-semibold text-sm ${cfg.corTexto}`}>{cfg.titulo}</p>
      </div>
      {mensagemHumana && (
        <p className={`text-sm mb-2 ${cfg.corTexto} opacity-90`}>{mensagemHumana}</p>
      )}
      <p className={`text-xs mb-3 ${cfg.corTexto} opacity-70`}>{cfg.descricao}</p>
      <button onClick={handleCta}
        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-colors ${cfg.corCta}`}>
        {cfg.cta}
      </button>
      <button onClick={() => setExpandido(!expandido)}
        className={`w-full mt-2 text-xs ${cfg.corTexto} opacity-50 hover:opacity-80 transition-opacity flex items-center justify-center gap-1`}>
        {expandido ? "Ocultar detalhes" : "Ver detalhes clínicos"}
        <svg className={`w-3 h-3 transition-transform ${expandido ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expandido && (
        <div className={`mt-2.5 pt-2.5 border-t ${cfg.borda} space-y-2`}>
          {triagem.recomendacao && (
            <div>
              <p className={`text-xs font-semibold ${cfg.corTexto} opacity-50 uppercase tracking-wide`}>Recomendação</p>
              <p className={`text-xs ${cfg.corTexto} mt-0.5`}>{triagem.recomendacao}</p>
            </div>
          )}
          {triagem.motivo && (
            <div>
              <p className={`text-xs font-semibold ${cfg.corTexto} opacity-50 uppercase tracking-wide`}>Motivo clínico</p>
              <p className={`text-xs ${cfg.corTexto} mt-0.5`}>{triagem.motivo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardAgendamento({ info }: { info: AgendamentoInfo }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 shadow-sm w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs" style={{ background: COR_VERDE }}>✓</span>
        <p className="font-semibold text-emerald-800 text-sm">Consulta Agendada!</p>
      </div>
      <div className="space-y-1 text-xs text-emerald-700">
        <div className="flex items-center gap-2"><span>👤</span><span>{info.nome}</span></div>
        <div className="flex items-center gap-2"><span>📅</span><span>{info.data}</span></div>
        <div className="flex items-center gap-2"><span>🕐</span><span>Período: {info.periodo}</span></div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: COR_VERDE }}>V</div>
      <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex gap-1 items-center h-3.5">
          {[0, 150, 300].map((d) => (
            <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Painel Chat ──────────────────────────────────────────────────────────────

function PainelChat({ onFechar }: { onFechar: () => void }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessaoId] = useState(() => crypto.randomUUID());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, streamingContent]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function enviar(texto?: string) {
    const msg = (texto ?? input).trim();
    if (!msg || carregando) return;

    setMensagens((prev) => [...prev, { role: "user", conteudo: msg }]);
    setInput("");
    setCarregando(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: msg, sessao_id: sessaoId }),
      });

      if (!res.ok || !res.body) throw new Error();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streaming = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            const event = JSON.parse(json) as {
              type: string; content?: string; conversacional?: string;
              triagem?: { urgencia: NonNullable<Urgencia>; recomendacao: string; motivo: string };
              protocolos?: string[];
            };
            if (event.type === "token" && event.content) {
              streaming += event.content;
              setStreamingContent(streaming);
            } else if (event.type === "done") {
              const conversacional = event.conversacional ?? "";
              const agendamento = detectarAgendamento(conversacional);
              setMensagens((prev) => [...prev, {
                role: "assistant",
                conteudo: conversacional,
                urgencia: event.triagem?.urgencia ?? null,
                agendamento: agendamento ?? undefined,
                triagem: event.triagem,
                protocolos: event.protocolos?.length ? event.protocolos : undefined,
              }]);
              setStreamingContent("");
            }
          } catch { /* ignorar JSON inválido */ }
        }
      }
    } catch {
      setMensagens((prev) => [...prev, { role: "assistant", conteudo: "Ops, tive um problema. Tente novamente." }]);
      setStreamingContent("");
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  }

  const ATALHOS_RAPIDOS = [
    { icon: "🩺", texto: "Fazer triagem de sintomas", msg: "Quero fazer uma triagem de sintomas" },
    { icon: "📅", texto: "Agendar consulta", msg: "Quero agendar uma consulta" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed inset-0 z-50 md:inset-auto md:bottom-6 md:right-6 flex flex-col
        md:w-[390px] md:h-[640px] md:rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0 text-white" style={{ background: COR_VERDE }}>
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold text-sm">V</div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2" style={{ borderColor: COR_VERDE }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm leading-none">Clara</p>
            <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium tracking-wide">✦ IA</span>
          </div>
          <p className="text-xs opacity-70 mt-0.5">Assistente de triagem · Alivia by jpazv</p>
        </div>
        <button onClick={onFechar}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-70 hover:opacity-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#f8faf9" }}>
        {mensagens.length === 0 && !carregando && !streamingContent && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md" style={{ background: COR_VERDE }}>V</div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Olá! Sou a Clara</p>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Assistente virtual da Alivia. Como posso ajudar?</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {ATALHOS_RAPIDOS.map((a) => (
                <button key={a.texto} onClick={() => enviar(a.msg)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm text-left text-xs text-gray-600 shadow-sm transition-all">
                  <span>{a.icon}</span><span>{a.texto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: COR_VERDE }}>V</div>
            )}
            <div className={`max-w-[82%] flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.triagem ? (
                <>
                  <CardTriagem triagem={msg.triagem} mensagemHumana={msg.conteudo} onAgendar={() => enviar("Quero agendar uma consulta")} />
                  {msg.protocolos && msg.protocolos.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 px-1 flex-wrap">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Baseado em: {msg.protocolos.join(" • ")}</span>
                    </div>
                  )}
                </>
              ) : msg.agendamento ? (
                <CardAgendamento info={msg.agendamento} />
              ) : (
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                  ${msg.role === "user" ? "text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"}`}
                  style={msg.role === "user" ? { background: COR_VERDE } : {}}>
                  {msg.conteudo}{msg.role === "assistant" && !msg.triagem && msg.protocolos && msg.protocolos.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 px-1 flex-wrap">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Baseado em: {msg.protocolos.join(" • ")}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 mt-0.5">P</div>
            )}
          </div>
        ))}

        {streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: COR_VERDE }}>V</div>
            <div className="max-w-[82%] bg-white border border-gray-100 px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
              {streamingContent}<span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {carregando && !streamingContent && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 py-3 flex-shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2
          focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
            placeholder="Digite sua mensagem..."
            rows={1}
            disabled={carregando}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none py-0.5 max-h-24 overflow-y-auto disabled:opacity-50"
          />
          <button onClick={() => enviar()} disabled={!input.trim() || carregando}
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: COR_LARANJA }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Alivia by jpazv</p>
      </div>
    </motion.div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onAbrirChat }: { onAbrirChat: () => void }) {

  const especialidades = [
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M9 6h6M8 9h8M9 12h6M8 15h8M9 18h6" />
        </svg>
      ),
      nome: "Coluna Vertebral",
      desc: "Hérnia de disco, escoliose, espondilose e lombalgias tratados com protocolos baseados em evidências.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3C10 3 8 5 8 8c0 2 1 4 2 5l-2 8h8l-2-8c1-1 2-3 2-5 0-3-2-5-4-5z" />
        </svg>
      ),
      nome: "Joelho",
      desc: "Artrose, lesões meniscais e ligamentares e condromalácia sem intervenção cirúrgica.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4a4 4 0 014 4c0 2-1 4-3 5l3 8H8l3-8c-2-1-3-3-3-5a4 4 0 014-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 21h12" />
        </svg>
      ),
      nome: "Quadril",
      desc: "Bursite, artrose e disfunções do quadril com abordagem multidisciplinar especializada.",
    },
  ];

  const passos = [
    {
      step: "01",
      titulo: "Descreva seus sintomas",
      desc: "Converse com a Clara. Ela é especializada em fisioterapia musculoesquelética e faz perguntas precisas.",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      step: "02",
      titulo: "Análise inteligente",
      desc: "Com base em protocolos clínicos do ITC, a Clara avalia urgência e especificidade dos sintomas.",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      step: "03",
      titulo: "Orientação personalizada",
      desc: "Receba orientação clara: pronto-socorro, consulta agendada ou cuidados no lar.",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });
  const [scrolled, setScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);

  // Scroll restoration
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  // Snap scroll: qualquer scroll pra baixo enquanto no hero → snap pra próxima seção
  useEffect(() => {
    let snapping = false;

    function handleWheel(e: WheelEvent) {
      if (snapping || e.deltaY < 30) return;
      // Só aciona se ainda estiver no hero (primeiros 80% da altura da viewport)
      if (window.scrollY > window.innerHeight * 0.8) return;
      snapping = true;
      const next = document.getElementById("stats-section");
      if (next) {
        const top = next.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setTimeout(() => { snapping = false; }, 1200);
    }

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 60); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToSection(id: string) {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) {
      const navH = 72;
      const top = el.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setTimeout(() => setActiveNav(null), 700);
  }

  return (
    <div className="bg-white">

      {/* ── Nav ── */}
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent border-b border-white/10"
        }`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <LogoAlivia dark={!scrolled} />
          <nav className="hidden md:flex items-center gap-8">
            {["Especialidades", "Como funciona"].map((item) => {
              const id = item.toLowerCase().replace(/ /g, "-");
              return (
                <motion.button
                  key={item}
                  onClick={() => scrollToSection(id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.93 }}
                  animate={activeNav === id ? { scale: [1, 0.9, 1.04, 1] } : {}}
                  transition={{ duration: 0.35 }}
                  className={`text-sm font-medium transition-colors relative ${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/75 hover:text-white"
                    }`}
                >
                  {item}
                  {activeNav === id && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: scrolled ? COR_VERDE : "white" }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="hero-section" className="relative overflow-hidden text-white min-h-screen flex flex-col"
        style={{ background: `linear-gradient(160deg, #134F47 0%, #1a6b61 55%, #0f3d36 100%)` }}>

        {/* Animated mesh blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="animate-blob absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #1a9e8e 0%, transparent 70%)" }} />
          <div className="animate-blob animation-delay-2000 absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #f47920 0%, transparent 70%)" }} />
          <div className="animate-blob animation-delay-4000 absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #134F47 0%, transparent 70%)" }} />
        </div>

        <div className="relative flex-1 max-w-6xl mx-auto w-full px-6 pt-32 pb-32 grid md:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase border border-white/20 rounded-full px-4 py-1.5 bg-white/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Clínica especializada · Coluna · Joelho · Quadril
            </span>

            <h1 className="text-4xl md:text-[3.25rem] font-bold leading-tight">
              Tratamento sem cirurgia<br />
              <span className="bg-gradient-to-r from-white to-[#f47920] bg-clip-text text-transparent">
                com tecnologia avançada
              </span>
            </h1>

            <p className="text-lg opacity-75 max-w-md leading-relaxed">
              Recupere sua qualidade de vida com protocolos clínicos baseados em evidências e acompanhamento especializado de ponta a ponta.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={onAbrirChat}
                className="btn-shimmer px-8 py-4 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg shadow-orange-900/30">
                Fazer triagem gratuita agora
              </button>
              <a href="#especialidades"
                className="px-8 py-4 rounded-2xl text-sm font-bold border-2 border-white/25 hover:bg-white/10 transition-all text-center">
                Conhecer especialidades
              </a>
            </div>

            {/* Social proof strip */}
            <div className="flex items-center gap-3 bg-white/8 rounded-2xl px-4 py-3 backdrop-blur-sm border border-white/10">
              <div className="flex -space-x-2">
                {["#e8f5e9", "#c8e6c9", "#a5d6a7", "#81c784"].map((bg, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: bg, color: COR_VERDE }}>
                    {["P", "M", "J", "A"][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-yellow-400 text-xs">★</span>)}
                  <span className="text-white font-semibold text-xs ml-1">4.9</span>
                </div>
                <p className="text-white/60 text-[11px]">+115 mil pacientes atendidos</p>
              </div>
            </div>
          </div>

          {/* Right — foto do paciente */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            className="hidden md:block relative h-[520px]"
          >
            {/* Imagem com clip diagonal */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl"
              style={{ clipPath: "polygon(9% 0, 100% 0, 100% 100%, 0 100%)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-pacient.jpg"
                alt="Paciente em atendimento fisioterapêutico"
                className="w-full h-full object-cover object-center"
              />
              {/* Overlay de fusão com o fundo */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to right, #134F47 0%, transparent 35%)" }} />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, #0f3d36 0%, transparent 40%)" }} />
            </div>

            {/* Floating card — Clara */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute top-8 left-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 z-20 flex items-center gap-3"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: COR_VERDE }}>V</div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white/20" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Clara · IA</p>
                <p className="text-white/50 text-[10px] mt-0.5">Analisando sintomas...</p>
              </div>
            </motion.div>

            {/* Floating card — stat */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.7 }}
              className="absolute bottom-10 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 z-20"
            >
              <p className="text-white text-xs font-bold">3 min de triagem</p>
              <p className="text-white/50 text-[10px] mt-0.5">resultado imediato · gratuito</p>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator + peek wave */}
        <div className="relative mt-auto">
          <div className="flex justify-center pb-6">
            <ScrollDownButton targetId="especialidades" label="Especialidades" dark />
          </div>
          {/* Wave that peeks the next section */}
          <svg
            viewBox="0 0 1440 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full block"
            preserveAspectRatio="none"
            style={{ height: "90px", display: "block" }}
          >
            <path
              d="M0,90 L0,55 C180,20 360,5 540,18 C720,30 900,65 1080,55 C1260,45 1350,25 1440,30 L1440,90 Z"
              fill="white"
            />
            <path
              d="M0,90 L0,70 C200,45 400,35 600,45 C800,55 1000,80 1200,70 C1350,62 1400,55 1440,52 L1440,90 Z"
              fill="white"
              opacity="0.5"
            />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats-section" className="py-16 border-b border-gray-100" style={{ background: "linear-gradient(to right, #f8faf9, white, #f8faf9)" }}>
        <div ref={statsRef} className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          {[
            {
              valor: 115, suffix: "k+", label: "Pacientes atendidos", icon: (
                <svg className="w-6 h-6 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: COR_VERDE }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )
            },
            {
              valor: 80, suffix: "+", label: "Unidades no Brasil", icon: (
                <svg className="w-6 h-6 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: COR_VERDE }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )
            },
            {
              valor: 20, suffix: "+", label: "Anos de experiência", icon: (
                <svg className="w-6 h-6 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: COR_VERDE }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              )
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              {s.icon}
              <p className="text-3xl md:text-4xl font-bold" style={{ color: COR_VERDE }}>
                <AnimatedCounter to={s.valor} suffix={s.suffix} />
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           ── Especialidades — esqueleto como fundo direito ──
           ══════════════════════════════════════════════════════════ */}
      <section id="especialidades" className="relative min-h-screen flex items-center overflow-hidden bg-white">

        {/* Esqueleto como background à direita */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block pointer-events-none select-none" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/esqueleto-hero.jpg"
            alt=""
            className="absolute right-0 top-1/2 -translate-y-1/2 h-[90%] w-auto object-contain opacity-25 skeleton-glow"
            style={{ mixBlendMode: "multiply" }}
          />
          {/* Overlay que funde com o branco à esquerda */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to right, white 30%, rgba(255,255,255,0.4) 65%, transparent 100%)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto w-full px-6 md:px-12 py-16 flex flex-col gap-10" style={{ minHeight: "calc(100vh - 72px)", justifyContent: "center" }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: COR_LARANJA }}>
              Áreas de tratamento
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
              Tratamos onde<br />
              <span className="bg-gradient-to-r from-[#134F47] to-[#1a9e8e] bg-clip-text text-transparent">
                a dor mora
              </span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
              Protocolos clínicos avançados e sem cirurgia para as principais causas de dor musculoesquelética no Brasil.
            </p>
          </motion.div>

          {/* Cards — 3 colunas no desktop */}
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl">
            {especialidades.map((esp, i) => (
              <motion.div
                key={esp.nome}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(19,79,71,0.12)" }}
                className="flex flex-col gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-5 cursor-default group transition-all shadow-sm"
                style={{ borderLeft: `3px solid ${COR_VERDE}` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${COR_VERDE}, #1a7a6e)` }}>
                  {esp.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{esp.nome}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{esp.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: COR_VERDE }}>
                  <span>Saiba mais</span>
                  <motion.svg
                    className="w-3.5 h-3.5"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    initial={{ x: 0 }} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </motion.svg>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA + scroll */}
          <div className="flex items-center gap-6">
            <button onClick={onAbrirChat}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 shadow-md"
              style={{ background: `linear-gradient(135deg, ${COR_VERDE}, #1a7a6e)` }}>
              Fazer triagem gratuita
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
            <ScrollDownButton targetId="como-funciona" label="Como funciona" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           ── Como Funciona — fundo claro, 3 colunas horizontais ──
           ══════════════════════════════════════════════════════════ */}
      <section id="como-funciona" className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#f4f6f5" }}>

        {/* Accent decorativo */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${COR_VERDE}40, transparent)` }} />

        <div className="relative max-w-6xl mx-auto w-full px-6 md:px-16 py-24 flex flex-col gap-16">

          {/* Header centralizado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto"
          >
            <span className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: COR_LARANJA }}>
              Triagem inteligente
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 mb-4">
              Da dor ao diagnóstico<br />
              <span style={{ color: COR_VERDE }}>em 3 passos</span>
            </h2>
            <p className="text-gray-500 leading-relaxed text-base">
              Em minutos, a Clara avalia seus sintomas com base em protocolos clínicos e indica o melhor caminho.
            </p>
          </motion.div>

          {/* 3 colunas de passos */}
          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Conectores tracejados entre os passos */}
            <div className="hidden md:block absolute top-10 left-[calc(33.3%-1rem)] right-[calc(33.3%-1rem)] h-px pointer-events-none" aria-hidden="true">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full h-full origin-left"
                style={{ borderTop: `2px dashed ${COR_VERDE}30` }}
              />
            </div>

            {passos.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col gap-4 bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Número grande decorativo de fundo */}
                <span className="absolute right-4 top-2 text-8xl font-black select-none pointer-events-none leading-none"
                  style={{ color: `${COR_VERDE}08` }}>
                  {item.step}
                </span>

                {/* Ícone */}
                <div className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ background: `linear-gradient(135deg, ${COR_VERDE}, #1a7a6e)` }}>
                  {item.icon}
                </div>

                {/* Texto */}
                <div className="relative z-10">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: COR_LARANJA }}>{item.step}</p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.titulo}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA central + stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-5"
          >
            <motion.button
              onClick={onAbrirChat}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-shimmer inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-sm font-bold shadow-xl shadow-orange-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Iniciar triagem agora
            </motion.button>

            <div className="flex items-center gap-6 text-center">
              {[["3 min", "tempo médio"], ["100%", "gratuito"], ["24/7", "disponível"]].map(([val, lbl], i) => (
                <div key={i} className="flex items-center gap-6">
                  {i > 0 && <div className="w-px h-8 bg-gray-200" />}
                  <div>
                    <p className="text-xl font-bold" style={{ color: COR_VERDE }}>{val}</p>
                    <p className="text-xs text-gray-400">{lbl}</p>
                  </div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-white" style={{ background: "#071a16" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-12">
          {/* Coluna 1 — Marca */}
          <div className="flex flex-col gap-4">
            <LogoAlivia dark size="md" />
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Triagem inteligente para fisioterapia musculoesquelética. Powered by IA clínica.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              IA ativa 24h
            </div>
          </div>

          {/* Coluna 2 — Produto */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Produto</p>
            <div className="flex flex-col gap-2.5">
              {["Como funciona", "Especialidades", "Falar com Clara"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const id = item === "Falar com Clara" ? null : item.toLowerCase().replace(/ /g, "-");
                    if (id) { const el = document.getElementById(id); el?.scrollIntoView({ behavior: "smooth" }); }
                    else onAbrirChat();
                  }}
                  className="text-sm text-white/50 hover:text-white transition-colors text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Coluna 3 — Legal */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">Legal</p>
            <div className="flex flex-col gap-2.5">
              {["Política de Privacidade", "Termos de Uso"].map((item) => (
                <span key={item} className="text-sm text-white/50 cursor-default">{item}</span>
              ))}
            </div>
            <p className="text-xs text-white/20 mt-2">jpazv · 2025</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/25">© 2025 Alivia by jpazv</p>
            <p className="text-xs text-white/20">Powered by Groq + Llama 3</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [chatAberto, setChatAberto] = useState(false);
  const [tooltipVisivel, setTooltipVisivel] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let buffer = "";
    const SECRET = "gestor";
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      buffer = (buffer + e.key.toLowerCase()).slice(-SECRET.length);
      if (buffer === SECRET) router.push("/dashboard");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <>
      <LandingPage onAbrirChat={() => setChatAberto(true)} />

      {/* Botão flutuante premium */}
      <AnimatePresence>
        {!chatAberto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
          >
            {/* Tooltip */}
            <AnimatePresence>
              {tooltipVisivel && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-xl shadow-lg whitespace-nowrap"
                >
                  Falar com Clara
                  <span className="text-white/50 ml-1">· IA</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setChatAberto(true)}
              onMouseEnter={() => setTooltipVisivel(true)}
              onMouseLeave={() => setTooltipVisivel(false)}
              className="btn-grad relative w-14 h-14 rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
              aria-label="Abrir chat com Clara"
            >
              {/* Double ping */}
              <span className="absolute w-full h-full rounded-full animate-ping opacity-20 bg-white" />
              <span className="absolute w-full h-full rounded-full animate-ping opacity-10 bg-white"
                style={{ animationDelay: "0.4s" }} />

              <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>

              {/* IA badge */}
              <span className="absolute -top-1 -right-1 bg-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm"
                style={{ color: COR_VERDE }}>
                IA
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel do chat */}
      <AnimatePresence>
        {chatAberto && <PainelChat onFechar={() => setChatAberto(false)} />}
      </AnimatePresence>
    </>
  );
}
