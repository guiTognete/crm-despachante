import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutGrid,
  MessageCircle,
  Users,
  ClipboardList,
  Settings,
  Search,
  Send,
  Check,
  Phone,
  FileText,
  ChevronLeft,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";

/* ============================================================
   CAMADA DE API
   Aponta para os endpoints reais desenhados no schema (/api/v1/...).
   DEMO_MODE=true serve dados mockados com a MESMA assinatura,
   simulando latência de rede — troque para false quando o
   backend (NestJS) estiver no ar. Nenhum componente abaixo
   precisa mudar quando isso acontecer.
   ============================================================ */

const API_BASE = "/api/v1";
const DEMO_MODE = true;
let authToken = null; // token fica em memória — artifacts não podem usar localStorage

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Erro ${res.status} ao chamar ${path}`);
  return res.json();
}

const MOCK_LEADS = [
  { id: 1, name: "Marcos Silva", initials: "MS", phone: "(18) 99801-2233", service: "Transferência de veículo", stage: "qualificacao", origin: "whatsapp", plate: "RJK4B12", model: "Fiat Argo 2021", value: 420 },
  { id: 2, name: "Juliana Prado", initials: "JP", phone: "(18) 99120-4471", service: "Recurso de multa", stage: "novo", origin: "whatsapp", plate: "OJI2C90", model: "Honda Civic 2019", value: 260 },
  { id: 3, name: "Fernanda Lima", initials: "FL", phone: "(18) 99933-1290", service: "2ª via de CRLV", stage: "orcamento", origin: "whatsapp", plate: "QVX9F45", model: "Hyundai HB20 2022", value: 180 },
  { id: 4, name: "Carlos Eduardo", initials: "CE", phone: "(18) 98211-0087", service: "Licenciamento anual", stage: "qualificacao", origin: "site", plate: "PLR7A31", model: "Chevrolet Onix 2020", value: 220 },
  { id: 5, name: "Roberto Alves", initials: "RA", phone: "(18) 99745-6612", service: "Defesa de pontuação", stage: "negociacao", origin: "whatsapp", plate: "SDT5E88", model: "Jeep Renegade 2021", value: 540 },
  { id: 6, name: "Patricia Souza", initials: "PS", phone: "(18) 99001-7734", service: "Transferência de veículo", stage: "fechado", origin: "whatsapp", plate: "RJK4B12", model: "Fiat Argo 2021", value: 380 },
];

const MOCK_MESSAGES = {
  1: [
    { from: "lead", text: "Boa tarde, vim pelo anúncio de vocês. Quero transferir um carro pra meu nome", time: "14:02" },
    { from: "me", text: "Boa tarde, Marcos! Consigo te ajudar sim. Você já tem o CRLV e o comprovante de venda em mãos?", time: "14:03" },
    { from: "lead", text: "Consigo mandar o CRLV hoje", time: "14:05" },
  ],
  2: [
    { from: "lead", text: "Oi, boa tarde! Recebi uma multa que acho injusta, dá pra recorrer?", time: "15:10" },
    { from: "me", text: "Boa tarde, Juliana! Dá sim. Pode me contar qual foi a infração e se já venceu o prazo de recurso?", time: "15:12" },
    { from: "lead", text: "Foi excesso de velocidade, chegou a notificação semana passada. Qual o valor do recurso?", time: "15:14" },
  ],
  3: [{ from: "lead", text: "Obrigada!", time: "11:40" }],
};

const MOCK_PROCESS_STEPS = {
  6: [
    { name: "Documentos recebidos", note: "CRLV, comprovante de venda, RG e CPF conferidos", date: "03/07", done: true },
    { name: "Protocolado no Detran", note: "Protocolo nº 8842910 gerado", date: "04/07", done: true },
    { name: "Aguardando aprovação do órgão", note: "Em análise no Detran-SP", date: "previsão 09/07", done: false },
    { name: "Emissão do novo CRLV", note: "Pendente", date: null, done: false },
    { name: "Entregue ao cliente", note: "Pendente", date: null, done: false },
  ],
};

const api = {
  leads: {
    // GET /leads
    list: async () => {
      if (DEMO_MODE) { await delay(450); return MOCK_LEADS; }
      return apiRequest("/leads");
    },
    // GET /leads/:id
    get: async (id) => {
      if (DEMO_MODE) { await delay(350); return MOCK_LEADS.find((l) => l.id === id); }
      return apiRequest(`/leads/${id}`);
    },
    // PATCH /leads/:id/stage
    updateStage: async (id, stage) => {
      if (DEMO_MODE) {
        await delay(300);
        const lead = MOCK_LEADS.find((l) => l.id === id);
        if (lead) lead.stage = stage;
        return lead;
      }
      return apiRequest(`/leads/${id}/stage`, { method: "PATCH", body: JSON.stringify({ stage }) });
    },
  },
  conversations: {
    // GET /conversations/:leadId/messages
    messages: async (leadId) => {
      if (DEMO_MODE) { await delay(350); return MOCK_MESSAGES[leadId] || []; }
      return apiRequest(`/conversations/${leadId}/messages`);
    },
    // POST /conversations/:leadId/messages
    send: async (leadId, text) => {
      if (DEMO_MODE) {
        await delay(300);
        const msg = { from: "me", text, time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) };
        MOCK_MESSAGES[leadId] = [...(MOCK_MESSAGES[leadId] || []), msg];
        return msg;
      }
      return apiRequest(`/conversations/${leadId}/messages`, { method: "POST", body: JSON.stringify({ text }) });
    },
  },
  deals: {
    // GET /deals/:leadId/progress (agregado por lead pra este protótipo)
    progress: async (leadId) => {
      if (DEMO_MODE) { await delay(350); return MOCK_PROCESS_STEPS[leadId] || []; }
      return apiRequest(`/deals/${leadId}/progress`);
    },
    // PATCH /deals/:id/progress/:stepId
    completeStep: async (leadId, stepIndex) => {
      if (DEMO_MODE) {
        await delay(250);
        const steps = MOCK_PROCESS_STEPS[leadId];
        if (steps && steps[stepIndex]) steps[stepIndex].done = true;
        return steps;
      }
      return apiRequest(`/deals/${leadId}/progress/${stepIndex}`, { method: "PATCH", body: JSON.stringify({ done: true }) });
    },
  },
};

/* ============================================================
   DESIGN TOKENS
   ============================================================ */

const colors = {
  navy: "#122341",
  navyDeep: "#0B1830",
  paper: "#F4F5F2",
  card: "#FFFFFF",
  ink: "#16202E",
  inkSoft: "#5C6675",
  line: "#E4E3DD",
  amber: "#E0972E",
  amberSoft: "#FBF0DD",
  green: "#3E8158",
  greenSoft: "#E4F0E7",
  blue: "#2C5A8C",
  blueSoft: "#E4EDF5",
  red: "#B54B36",
  redSoft: "#F6E6E1",
};

const STAGES = [
  { id: "novo", label: "Novo lead", color: colors.inkSoft, bg: "#EEEDE9" },
  { id: "qualificacao", label: "Qualificação", color: colors.blue, bg: colors.blueSoft },
  { id: "orcamento", label: "Orçamento", color: colors.amber, bg: colors.amberSoft },
  { id: "negociacao", label: "Negociação", color: colors.amber, bg: colors.amberSoft },
  { id: "fechado", label: "Fechado", color: colors.green, bg: colors.greenSoft },
];

/* ============================================================
   COMPONENTES DE APOIO
   ============================================================ */

function PlateBadge({ plate, size = "sm" }) {
  const h = size === "sm" ? 20 : 26;
  const fs = size === "sm" ? 11 : 13;
  return (
    <span style={{ display: "inline-flex", alignItems: "stretch", height: h, borderRadius: 4, overflow: "hidden", border: `1px solid ${colors.line}`, fontFamily: "'IBM Plex Mono', monospace" }}>
      <span style={{ background: colors.blue, width: 6 }} />
      <span style={{ background: "#F7F8F5", color: colors.ink, fontSize: fs, fontWeight: 600, letterSpacing: "0.06em", padding: "0 8px", display: "flex", alignItems: "center" }}>
        {plate}
      </span>
    </span>
  );
}

function Avatar({ initials, tone = "blue" }) {
  const map = { blue: { bg: colors.blueSoft, fg: colors.blue }, green: { bg: colors.greenSoft, fg: colors.green } };
  const t = map[tone];
  return (
    <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function StageTag({ stageId, onChange }) {
  const s = STAGES.find((x) => x.id === stageId);
  return (
    <select
      value={stageId}
      onChange={(e) => onChange && onChange(e.target.value)}
      style={{ fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, padding: "4px 8px", borderRadius: 5, border: "none", cursor: onChange ? "pointer" : "default" }}
    >
      {STAGES.map((st) => (
        <option key={st.id} value={st.id}>{st.label}</option>
      ))}
    </select>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", borderRadius: 8, background: active ? "rgba(255,255,255,0.08)" : "transparent", color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)", border: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 500, textAlign: "left" }}>
      <Icon size={17} strokeWidth={2} />
      {label}
    </button>
  );
}

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.inkSoft, fontSize: 13, padding: 24 }}>
      <Loader2 size={16} className="spin" />
      {label}
      <style>{`.spin{animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.red, background: colors.redSoft, fontSize: 13, padding: "10px 14px", borderRadius: 8, marginBottom: 14 }}>
      <AlertTriangle size={15} />
      {message}
    </div>
  );
}

/* ============================================================
   VIEWS — cada uma busca seus próprios dados via api.*
   ============================================================ */

function KanbanView({ onOpenLead }) {
  const [leads, setLeads] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api.leads.list().then((data) => alive && setLeads(data)).catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  if (error) return <ErrorBanner message={`Não foi possível carregar os leads: ${error}`} />;
  if (!leads) return <Spinner label="Carregando funil..." />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: colors.ink }}>Funil de leads</h1>
          <p style={{ fontSize: 13, color: colors.inkSoft, margin: "2px 0 0" }}>Rápido Despachante · {leads.length} leads ativos</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, background: colors.navy, color: "#fff", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Novo lead
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 12 }}>
        {STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage.id);
          return (
            <div key={stage.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingLeft: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: colors.inkSoft, margin: 0 }}>
                  {stage.label} <span style={{ color: "#B7B3A8" }}>· {items.length}</span>
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((lead) => (
                  <div key={lead.id} onClick={() => onOpenLead(lead.id)} style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 10, padding: 12, cursor: "pointer" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: colors.ink }}>{lead.name}</p>
                    <p style={{ fontSize: 12, color: colors.inkSoft, margin: "0 0 8px" }}>{lead.service}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <PlateBadge plate={lead.plate} />
                      {lead.stage === "fechado" ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: colors.green }}>R$ {lead.value}</span>
                      ) : lead.origin === "whatsapp" ? (
                        <MessageCircle size={14} color={colors.green} />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AtendimentoView({ activeLeadId, setActiveLeadId, onOpenLead }) {
  const [leads, setLeads] = useState(null);
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.leads.list().then(setLeads).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!activeLeadId) return;
    setMessages(null);
    api.conversations.messages(activeLeadId).then(setMessages).catch((e) => setError(e.message));
  }, [activeLeadId]);

  const chatLeads = (leads || []).filter((l) => [1, 2, 3].includes(l.id));
  const lead = (leads || []).find((l) => l.id === activeLeadId);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      const msg = await api.conversations.send(activeLeadId, draft.trim());
      setMessages((prev) => [...(prev || []), msg]);
      setDraft("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  if (error) return <ErrorBanner message={`Erro no atendimento: ${error}`} />;
  if (!leads || !lead) return <Spinner label="Carregando conversas..." />;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px", color: colors.ink }}>Atendimento</h1>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", border: `1px solid ${colors.line}`, borderRadius: 12, overflow: "hidden", height: 460, background: colors.card }}>
        <div style={{ borderRight: `1px solid ${colors.line}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 10, borderBottom: `1px solid ${colors.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: colors.paper, borderRadius: 7, padding: "7px 10px" }}>
              <Search size={14} color={colors.inkSoft} />
              <span style={{ fontSize: 12.5, color: colors.inkSoft }}>Buscar conversa</span>
            </div>
          </div>
          {chatLeads.map((l) => (
            <div key={l.id} onClick={() => setActiveLeadId(l.id)} style={{ padding: "11px 14px", cursor: "pointer", background: l.id === lead.id ? colors.paper : "transparent", borderBottom: `1px solid ${colors.line}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colors.ink }}>{l.name}</p>
              <p style={{ fontSize: 12, color: colors.inkSoft, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.service}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${colors.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials={lead.initials} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colors.ink }}>{lead.name}</p>
                <p style={{ fontSize: 11.5, color: colors.inkSoft, margin: 0 }}>{lead.service}</p>
              </div>
            </div>
            <button onClick={() => onOpenLead(lead.id)} style={{ fontSize: 12, fontWeight: 600, color: colors.blue, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              Ver lead <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
            </button>
          </div>

          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
            {messages === null ? (
              <Spinner label="Carregando mensagens..." />
            ) : (
              messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.from === "me" ? "flex-end" : "flex-start", maxWidth: "72%", background: m.from === "me" ? colors.blueSoft : colors.paper, borderRadius: 12, borderBottomRightRadius: m.from === "me" ? 4 : 12, borderBottomLeftRadius: m.from === "me" ? 12 : 4, padding: "9px 12px" }}>
                  <p style={{ fontSize: 13, margin: 0, color: colors.ink }}>{m.text}</p>
                  <p style={{ fontSize: 10, color: colors.inkSoft, margin: "4px 0 0" }}>{m.time}</p>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 10, borderTop: `1px solid ${colors.line}`, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite uma mensagem"
              style={{ flex: 1, fontSize: 13, border: `1px solid ${colors.line}`, borderRadius: 8, padding: "9px 12px", outline: "none" }}
            />
            <button onClick={handleSend} disabled={sending} style={{ background: colors.navy, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: sending ? "default" : "pointer", opacity: sending ? 0.6 : 1 }}>
              {sending ? <Loader2 size={15} color="#fff" className="spin" /> : <Send size={15} color="#fff" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadDetailView({ leadId, onBack }) {
  const [lead, setLead] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLead(null);
    api.leads.get(leadId).then(setLead).catch((e) => setError(e.message));
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  const handleStageChange = async (stage) => {
    const updated = await api.leads.updateStage(leadId, stage);
    setLead(updated);
  };

  if (error) return <ErrorBanner message={`Erro ao carregar lead: ${error}`} />;
  if (!lead) return <Spinner label="Carregando lead..." />;

  const docs = [
    { name: "CRLV", status: lead.stage === "fechado" ? "Recebido" : "Aguardando" },
    { name: "Comprovante de venda", status: "Recebido" },
    { name: "RG e CPF", status: lead.stage === "fechado" ? "Recebido" : "Aguardando" },
  ];

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: colors.inkSoft, background: "none", border: "none", cursor: "pointer", marginBottom: 14 }}>
        <ChevronLeft size={14} /> Voltar
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar initials={lead.initials} tone={lead.stage === "fechado" ? "green" : "blue"} />
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0, color: colors.ink }}>{lead.name}</p>
            <p style={{ fontSize: 13, color: colors.inkSoft, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <Phone size={12} /> {lead.phone}
            </p>
          </div>
        </div>
        <StageTag stageId={lead.stage} onChange={handleStageChange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: colors.ink }}>Veículo</p>
          <div style={{ marginBottom: 10 }}><PlateBadge plate={lead.plate} size="lg" /></div>
          <p style={{ fontSize: 13, color: colors.inkSoft, margin: 0 }}>{lead.model}</p>
        </div>
        <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 12, padding: "16px 18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px", color: colors.ink }}>Serviço</p>
          <p style={{ fontSize: 13, color: colors.ink, margin: "0 0 6px" }}>{lead.service}</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: colors.ink, margin: 0 }}>R$ {lead.value}</p>
        </div>
      </div>

      <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 12, padding: "16px 18px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 12px", color: colors.ink }}>Documentos</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {docs.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: colors.ink, display: "flex", alignItems: "center", gap: 6 }}>
                <FileText size={14} color={colors.inkSoft} /> {d.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5, color: d.status === "Recebido" ? colors.green : colors.amber, background: d.status === "Recebido" ? colors.greenSoft : colors.amberSoft }}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessoView() {
  const leadId = 6; // Patricia Souza — negócio fechado usado como exemplo
  const [lead, setLead] = useState(null);
  const [steps, setSteps] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.leads.get(leadId).then(setLead).catch((e) => setError(e.message));
    api.deals.progress(leadId).then(setSteps).catch((e) => setError(e.message));
  }, []);

  const handleCompleteStep = async (index) => {
    const updated = await api.deals.completeStep(leadId, index);
    setSteps([...updated]);
  };

  if (error) return <ErrorBanner message={`Erro ao carregar processo: ${error}`} />;
  if (!lead || !steps) return <Spinner label="Carregando processo..." />;

  const firstPending = steps.findIndex((s) => !s.done);

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 16px", color: colors.ink }}>Processo pós-venda</h1>
      <div style={{ background: colors.card, border: `1px solid ${colors.line}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar initials={lead.initials} tone="green" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: colors.ink }}>{lead.name}</p>
              <p style={{ fontSize: 12.5, color: colors.inkSoft, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                {lead.service} <PlateBadge plate={lead.plate} />
              </p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: colors.amber, background: colors.amberSoft, padding: "4px 10px", borderRadius: 6 }}>Em andamento</span>
        </div>

        <div>
          {steps.map((s, i) => {
            const active = i === firstPending;
            return (
              <div key={s.name} style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button
                    onClick={() => !s.done && active && handleCompleteStep(i)}
                    style={{ width: 20, height: 20, borderRadius: "50%", background: s.done ? colors.green : "#fff", border: s.done ? "none" : `2px solid ${active ? colors.amber : colors.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: active && !s.done ? "pointer" : "default", padding: 0 }}
                  >
                    {s.done && <Check size={12} color="#fff" />}
                  </button>
                  {i < steps.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 26, background: colors.line }} />}
                </div>
                <div style={{ paddingBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: colors.ink }}>{s.name}</p>
                  <p style={{ fontSize: 12, margin: "2px 0 0", color: active ? colors.amber : colors.inkSoft }}>
                    {s.note} {s.date ? `· ${s.date}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */

export default function App() {
  const [view, setView] = useState("funil");
  const [selectedLeadId, setSelectedLeadId] = useState(1);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  const openLead = (id) => {
    setSelectedLeadId(id);
    setView("lead");
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: "flex", minHeight: 600, background: colors.paper, borderRadius: 14, overflow: "hidden", border: `1px solid ${colors.line}` }}>
      <div style={{ width: 208, background: colors.navyDeep, padding: "18px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 20px" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: colors.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: colors.navyDeep }}>R</div>
          <span style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>Rápido Despachante</span>
        </div>
        <NavItem icon={LayoutGrid} label="Funil" active={view === "funil"} onClick={() => setView("funil")} />
        <NavItem icon={MessageCircle} label="Atendimento" active={view === "atendimento"} onClick={() => setView("atendimento")} />
        <NavItem icon={Users} label="Clientes" active={view === "lead"} onClick={() => setView("lead")} />
        <NavItem icon={ClipboardList} label="Processos" active={view === "processo"} onClick={() => setView("processo")} />
        <div style={{ flex: 1 }} />
        <NavItem icon={Settings} label="Configurações" active={false} onClick={() => {}} />
      </div>

      <div style={{ flex: 1, padding: 24, overflow: "auto" }}>
        {DEMO_MODE && (
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.amber, background: colors.amberSoft, display: "inline-block", padding: "3px 9px", borderRadius: 5, marginBottom: 14 }}>
            Modo demonstração · dados simulados
          </div>
        )}
        {view === "funil" && <KanbanView onOpenLead={openLead} />}
        {view === "atendimento" && <AtendimentoView activeLeadId={selectedLeadId} setActiveLeadId={setSelectedLeadId} onOpenLead={openLead} />}
        {view === "lead" && <LeadDetailView leadId={selectedLeadId} onBack={() => setView("funil")} />}
        {view === "processo" && <ProcessoView />}
      </div>
    </div>
  );
}

