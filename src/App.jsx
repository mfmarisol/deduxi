import { useState, useEffect } from "react";

/* ── Google Font: Inter ── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 0; }
    .gradient-btn {
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      box-shadow: 0 4px 24px 0 rgba(124,58,237,0.25);
    }
    .gradient-btn:hover {
      background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
      box-shadow: 0 6px 28px 0 rgba(124,58,237,0.35);
    }
    .input-field {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 11px 16px;
      font-size: 14px;
      color: #111827;
      width: 100%;
      max-width: 100%;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: #fafafa;
      box-sizing: border-box !important;
      display: block;
    }
    .input-field:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
      background: #fff;
    }
    .input-field::placeholder { color: #9ca3af; }
    .status-dot { display:inline-block; width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .chip {
      display:inline-flex; align-items:center; gap:5px;
      padding: 3px 10px; border-radius:99px; font-size:12px; font-weight:600;
    }

    /* ── Responsive grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    }

    /* ── Navbar step buttons: hide on mobile (bottom nav handles it) ── */
    .nav-steps { display: flex; gap: 4px; }
    @media (max-width: 700px) { .nav-steps { display: none; } }

    /* ── ARCA badge: hide on small screens ── */
    .arca-badge { display: flex; }
    @media (max-width: 500px) { .arca-badge { display: none; } }

    /* ── Analysis header: stack on mobile ── */
    .analysis-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    @media (max-width: 500px) {
      .analysis-header { flex-direction: column; gap: 10px; }
      .analysis-header .total-block { text-align: left; }
    }

    /* ── Ticket action buttons: wrap on mobile ── */
    .ticket-actions { display: flex; gap: 6px; flex-shrink: 0; }
    @media (max-width: 480px) { .ticket-actions { flex-direction: column; gap: 4px; } }

    /* ── Add ticket form rows ── */
    .form-row-2 { display: flex; gap: 10px; }
    .form-row-3 { display: flex; gap: 10px; }
    @media (max-width: 500px) {
      .form-row-2 { flex-direction: column; }
      .form-row-3 { flex-direction: column; }
    }

    /* ── Savings row ── */
    .savings-detail { display: flex; justify-content: space-between; font-size: 12px; }
    @media (max-width: 400px) {
      .savings-detail { flex-direction: column; gap: 4px; }
    }

    /* ── RRHH row ── */
    .rrhh-row { display: flex; gap: 8px; }
    @media (max-width: 480px) {
      .rrhh-row { flex-direction: column; }
      .rrhh-row button { width: 100%; }
    }

    /* ── Legend chips wrap ── */
    .legend-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

    /* ── Change summary ── */
    .change-summary { display: flex; gap: 12px; flex-wrap: wrap; }

    /* ── ARCA timeline: smaller on mobile ── */
    @media (max-width: 480px) {
      .timeline-node span.node-label { font-size: 10px; }
    }

    /* ── Login card ── */
    .login-card {
      background: rgba(255,255,255,0.97);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 32px 28px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.1);
      overflow: hidden;
    }
    .login-card form { overflow: hidden; }
    @media (max-width: 400px) {
      .login-card { padding: 24px 16px; border-radius: 16px; }
    }

    .login-google-btn {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
      border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 11px 16px;
      background: #fff; color: #374151; font-weight: 600; font-size: 14px;
      cursor: pointer; transition: all 0.15s; margin-bottom: 16px;
    }
    .login-google-btn:hover { background: #f9fafb; border-color: #d1d5db; }

    .login-bg {
      min-height: 100vh;
      background: linear-gradient(145deg, #0d0b1f 0%, #1a1040 40%, #2d1b69 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 24px 16px; position: relative; overflow: hidden;
    }
    .login-bg::before {
      content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
      top: -200px; right: -200px; pointer-events: none;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
  `}</style>
);

/* ── AI ticket classifier (simulated) ── */
const classifyTicket = (t) => {
  const name = (t.provider || "").toLowerCase();
  if (/coto|carrefour|walmart|vea |disco |jumbo|superm|almacen|diarco|makro/.test(name))
    return { status: "rejected", reason: "Supermercado – alimentos y consumo cotidiano no aplican como equipamiento laboral" };
  if (/autopista|peaje|urbanas|cablevision|edenor|metrogas|fibertel|telecom|edesur|gas ban/.test(name))
    return { status: "rejected", reason: "Servicio domiciliario o peaje – no aplica como equipamiento de trabajo" };
  if (/tech|software|digital|sistemas|inform[aá]tic|computo|developer|studio|design|media|it s\.r|cloud|data|code|web/.test(name))
    return { status: "approved", reason: "Empresa tech/digital – aplica como equipamiento o herramienta de trabajo" };
  if (/mercadolibre|amazon|linio|tienda oficial/.test(name))
    return { status: "pending", reason: "Marketplace – el resultado depende del producto comprado (equipamiento sí, alimentos no)" };
  if (/s\.r\.l\.|srl|s\.a\.|s\.a |sociedad|corp|ltda|s\.a$/.test(name))
    return { status: "approved", reason: "Persona jurídica – posiblemente aplica; confirmar rubro con contador" };
  const words = name.trim().split(/\s+/);
  if (words.length <= 3)
    return { status: "pending", reason: "Persona física – confirmar si el rubro encuadra en SIRADIG (art. 82 inc. h)" };
  return { status: "pending", reason: "A confirmar – verificar categoría del proveedor en ARCA" };
};

const steps = ["Inicio", "Mis Tickets", "Análisis IA", "Presentar en ARCA"];
const statusConfig = {
  approved: { label: "Aplica",      bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", dot: "#10b981" },
  rejected: { label: "No aplica",   bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#ef4444" },
  pending:  { label: "A confirmar", bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#f59e0b" },
  loaded:   { label: "Cargado",     bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#3b82f6" },
};

const fmt = (n) => "$\u00a0" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const LogoBrand = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 14px rgba(124,58,237,0.4)",
  }}>
    <svg viewBox="0 0 20 20" width={size * 0.52} height={size * 0.52} fill="none">
      <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="2" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  </div>
);

const Spinner = ({ size = 18, color = "#7c3aed" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    border: `2.5px solid ${color}22`, borderTopColor: color,
    animation: "spin 0.7s linear infinite", flexShrink: 0,
  }}/>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function Deduxi() {
  const [screen, setScreen] = useState("login");

  /* login */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  /* connect-arca */
  const [cuit, setCuit] = useState("");
  const [claveFiscal, setClaveFiscal] = useState("");
  const [showClave, setShowClave] = useState(false);
  const [arcaConnecting, setArcaConnecting] = useState(false);
  const [arcaConnected, setArcaConnected] = useState(false);
  const [arcaError, setArcaError] = useState(null); // null | "cuit" | "clave"

  /* ARCA 3-phase connection */
  const [arcaPhase, setArcaPhase] = useState("cuit"); // "cuit" | "captcha" | "verifying"
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaSessionId, setCaptchaSessionId] = useState(null);
  const [captchaSolution, setCaptchaSolution] = useState("");
  const [arcaErrMsg, setArcaErrMsg] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "https://deduxi-backend.onrender.com";

  /* app */
  const [step, setStep] = useState(0);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [editingClave, setEditingClave] = useState(false);
  const [newClaveFiscal, setNewClaveFiscal] = useState("");
  const [showNewClave, setShowNewClave] = useState(false);
  const [savingClave, setSavingClave] = useState(false);
  const [claveSaved, setClaveSaved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [presentProgress, setPresentProgress] = useState(0);
  const [arcaStatus, setArcaStatus] = useState("draft");
  const [showRectModal, setShowRectModal] = useState(false);
  const [rectifying, setRectifying] = useState(false);
  const [isRectificativa, setIsRectificativa] = useState(false);
  const [rectVersion, setRectVersion] = useState(1);
  const [ticketActions, setTicketActions] = useState({});
  const [ticketEdits, setTicketEdits] = useState({});
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [tickets, setTickets] = useState([]);         // user's real tickets (starts empty)
  const [arcaFetched, setArcaFetched] = useState(false); // whether ARCA fetch simulated
  const [addedTickets, setAddedTickets] = useState([]);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ provider: "", cuitProv: "", date: "", amount: "", number: "", type: "Factura B" });
  const [rrhhEmail, setRrhhEmail] = useState("");
  const [rrhhSaved, setRrhhSaved] = useState(false);
  const [savingRrhh, setSavingRrhh] = useState(false);

  /* responsive */
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  /* persist session in localStorage so refresh doesn't log out */
  useEffect(() => {
    const saved = localStorage.getItem("deduxi_screen");
    if (saved === "app" || saved === "connect-arca") setScreen(saved);
    const savedCuit = localStorage.getItem("deduxi_cuit");
    if (savedCuit) setCuit(savedCuit);
    const savedTickets = localStorage.getItem("deduxi_tickets");
    if (savedTickets) { try { const t = JSON.parse(savedTickets); if (Array.isArray(t)) { setTickets(t); if (t.length > 0) setArcaFetched(true); } } catch(e) {} }
    const savedArcaFetched = localStorage.getItem("deduxi_arca_fetched");
    if (savedArcaFetched === "1") setArcaFetched(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("deduxi_screen", screen);
  }, [screen]);
  useEffect(() => {
    localStorage.setItem("deduxi_tickets", JSON.stringify(tickets));
  }, [tickets]);

  const TAX_RATE = 0.27;
  const totalApproved = tickets.filter(t => t.status === "approved" || t.status === "loaded").reduce((a, b) => a + b.amount, 0);
  const totalRejected = tickets.filter(t => t.status === "rejected").reduce((a, b) => a + b.amount, 0);
  const totalPending  = tickets.filter(t => t.status === "pending").reduce((a, b) => a + b.amount, 0);
  const monthlySaving = Math.round(totalApproved * TAX_RATE);
  const resolvedCount = tickets.filter(t => t.status === "approved" || t.status === "loaded" || t.status === "rejected").length;

  const cardStyle = {
    background: "#fff", border: "1.5px solid #f1f0ff", borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 24px rgba(124,58,237,0.04)",
    padding: "20px 24px",
  };

  const handleGoogleLogin = () => {
    setLoginLoading(true); setLoginMethod("google");
    setTimeout(() => { setLoginLoading(false); setScreen("connect-arca"); }, 1600);
  };
  const handleEmailLogin = (e) => {
    e.preventDefault(); if (!loginEmail) return;
    setLoginLoading(true); setLoginMethod("email");
    setTimeout(() => { setLoginLoading(false); setEmailSent(true); }, 1200);
  };
  /* Phase 1: submit CUIT → get CAPTCHA from real ARCA */
  const handleArcaStart = async () => {
    const cuitDigits = cuit.replace(/\D/g, "");
    if (cuitDigits.length !== 11) { setArcaError("cuit"); return; }
    setArcaError(null);
    setArcaErrMsg("");
    setArcaConnecting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
    try {
      const res = await fetch(`${API_URL}/api/arca/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cuit }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data.ok) {
        setCaptchaImage(data.captcha);
        setCaptchaSessionId(data.sessionId);
        setArcaPhase("captcha");
      } else {
        setArcaErrMsg(data.msg || "No pudimos conectar con ARCA.");
        if (data.error === "cuit_no_encontrado") setArcaError("cuit");
      }
    } catch (e) {
      if (e.name === "AbortError") {
        setArcaErrMsg("La conexión tardó demasiado. El servidor puede estar iniciando, intentá de nuevo en 30 segundos.");
      } else {
        setArcaErrMsg("Error de conexión. Verificá tu internet e intentá de nuevo.");
      }
    } finally {
      clearTimeout(timeout);
      setArcaConnecting(false);
    }
  };

  /* Phase 2: submit clave + CAPTCHA solution → real ARCA login */
  const handleArcaComplete = async () => {
    if (!claveFiscal || !captchaSolution) return;
    setArcaErrMsg("");
    setArcaPhase("verifying");
    try {
      const res = await fetch(`${API_URL}/api/arca/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: captchaSessionId, clave: claveFiscal, captchaSolution }),
      });
      const data = await res.json();
      if (data.ok) {
        setArcaConnected(true);
        localStorage.setItem("deduxi_cuit", cuit);
        localStorage.setItem("deduxi_arca_fetched", "1");
        setArcaFetched(true);
        setClaveFiscal(""); // don't keep clave in memory
      } else {
        if (data.error === "captcha_incorrecto") {
          if (data.captcha) setCaptchaImage(data.captcha);
          setCaptchaSolution("");
          setArcaErrMsg(data.msg || "Código incorrecto. Intentá de nuevo.");
          setArcaPhase("captcha");
        } else if (data.error === "sesion_expirada") {
          setArcaPhase("cuit");
          setArcaErrMsg("La sesión expiró. Ingresá tu CUIT de nuevo.");
        } else {
          // Wrong clave or other error
          setArcaError("clave");
          setArcaErrMsg(data.msg || "Clave fiscal incorrecta.");
          setArcaPhase("captcha");
        }
      }
    } catch (e) {
      setArcaErrMsg("Error de conexión. Intentá de nuevo.");
      setArcaPhase("captcha");
    }
  };

  /* Refresh CAPTCHA image */
  const handleRefreshCaptcha = async () => {
    try {
      const res = await fetch(`${API_URL}/api/arca/refresh-captcha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: captchaSessionId }),
      });
      const data = await res.json();
      if (data.ok && data.captcha) { setCaptchaImage(data.captcha); setCaptchaSolution(""); }
      else { setArcaPhase("cuit"); setArcaErrMsg("La sesión expiró. Ingresá tu CUIT de nuevo."); }
    } catch (_) {}
  };

  // Keep old name as alias for the button onClick
  const handleArcaConnect = handleArcaStart;
  const handleUpdateClave = () => {
    if (!newClaveFiscal) return;
    setSavingClave(true);
    setTimeout(() => {
      setSavingClave(false); setClaveSaved(true); setNewClaveFiscal(""); setEditingClave(false);
      setTimeout(() => setClaveSaved(false), 3500);
    }, 1600);
  };
  const handlePresent = () => {
    setPresenting(true); setPresentProgress(0);
    const iv = setInterval(() => {
      setPresentProgress(p => {
        if (p >= 100) { clearInterval(iv); setPresenting(false); setArcaStatus("draft"); return 100; }
        return p + 3;
      });
    }, 90);
  };
  const handleRectificar = () => {
    setRectifying(true);
    setTimeout(() => {
      setRectifying(false); setShowRectModal(false);
      setIsRectificativa(true); setRectVersion(v => v + 1);
      setUploaded(false); setAnalyzed(false); setAnalyzing(false);
      setPresenting(false); setPresentProgress(0); setArcaStatus("pending");
      setStep(1);
    }, 1800);
  };

  /* ════════════════════════════════════════
     SCREEN: LOGIN
  ════════════════════════════════════════ */
  if (screen === "login") return (
    <>
      <FontLoader />
      <div className="login-bg">
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <LogoBrand size={56} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>
                  DEDU<span style={{ color: "#a78bfa" }}>XÍ</span>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6, fontWeight: 500 }}>
                  Tus deducciones, sin fricción
                </p>
              </div>
            </div>
          </div>

          <div className="login-card">
            {!emailSent ? (<>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Ingresá a tu cuenta</h2>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 22 }}>¿Primera vez? Se crea automáticamente.</p>
              <button onClick={handleGoogleLogin} disabled={loginLoading} className="login-google-btn" style={{ opacity: loginLoading ? 0.7 : 1 }}>
                {loginLoading && loginMethod === "google" ? <Spinner size={16} color="#7c3aed"/> : <GoogleIcon />}
                Continuar con Google
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "#f3f4f6" }}/>
                <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>o email</span>
                <div style={{ flex: 1, height: 1, background: "#f3f4f6" }}/>
              </div>
              <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input className="input-field" type="email" placeholder="nombre@empresa.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                <button type="submit" disabled={loginLoading || !loginEmail} className="gradient-btn" style={{
                  width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 16px",
                  cursor: loginLoading || !loginEmail ? "not-allowed" : "pointer", opacity: loginLoading || !loginEmail ? 0.55 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loginLoading && loginMethod === "email" && <Spinner size={15} color="#fff"/>}
                  Recibir link de acceso
                </button>
              </form>
              <p style={{ fontSize: 11, color: "#d1d5db", textAlign: "center", marginTop: 18, lineHeight: 1.7 }}>Sin contraseñas. Un link directo a tu mail. 🪄</p>
            </>) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📬</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Revisá tu mail</h3>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Mandamos un link a</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", marginBottom: 18 }}>{loginEmail}</p>
                <button onClick={() => setScreen("connect-arca")} style={{ fontSize: 12, color: "#c4b5fd", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  (demo: simular ingreso →)
                </button>
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 20, lineHeight: 1.7 }}>
            Al ingresar aceptás los <span style={{ color: "rgba(167,139,250,0.7)", cursor: "pointer" }}>Términos de uso</span>{" "}y la{" "}
            <span style={{ color: "rgba(167,139,250,0.7)", cursor: "pointer" }}>Política de privacidad</span>.
          </p>
        </div>
      </div>
    </>
  );

  /* ════════════════════════════════════════
     SCREEN: CONECTAR ARCA
  ════════════════════════════════════════ */
  if (screen === "connect-arca") return (
    <>
      <FontLoader />
      <div style={{ minHeight: "100vh", background: "#f5f4fe", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 28 }}>
            <LogoBrand size={34} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>DEDU<span style={{ color: "#7c3aed" }}>XÍ</span></span>
          </div>
          <div style={{ ...cardStyle, padding: "28px 24px", overflow: "hidden" }}>
            {!arcaConnected ? (<>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg, #ede9fe, #ddd6fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔗</div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Conectá tu cuenta ARCA</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>
                    {arcaPhase === "cuit" ? "Ingresá tu CUIT para continuar." : arcaPhase === "captcha" ? "Completá la verificación de ARCA." : "Verificando con ARCA…"}
                  </p>
                </div>
              </div>

              {/* Security note */}
              <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 20 }}>
                <span style={{ color: "#7c3aed", marginTop: 1, flexShrink: 0 }}><ShieldIcon /></span>
                <p style={{ fontSize: 12, color: "#6d28d9", lineHeight: 1.6 }}>Tu clave fiscal <strong>nunca se almacena</strong>. Se usa una única vez para autenticarte en ARCA y se descarta.</p>
              </div>

              {/* ── Phase 1: CUIT ── */}
              {arcaPhase === "cuit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: arcaError === "cuit" ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>CUIT</label>
                    <input className="input-field" type="text" placeholder="20-12345678-9" value={cuit}
                      onChange={e => { setCuit(e.target.value); setArcaError(null); setArcaErrMsg(""); }}
                      onKeyDown={e => e.key === "Enter" && handleArcaStart()}
                      style={{ borderColor: arcaError === "cuit" ? "#fca5a5" : undefined, background: arcaError === "cuit" ? "#fff5f5" : undefined }} />
                    {(arcaError === "cuit" || arcaErrMsg) && (
                      <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6, lineHeight: 1.5 }}>
                        ⚠️ {arcaErrMsg || "El CUIT debe tener 11 dígitos (ej: 20-12345678-9)."}
                      </p>
                    )}
                  </div>
                  <button onClick={handleArcaStart} disabled={arcaConnecting || !cuit} className="gradient-btn" style={{
                    width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 16px",
                    cursor: arcaConnecting || !cuit ? "not-allowed" : "pointer", opacity: !cuit ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {arcaConnecting ? <><Spinner size={15} color="#fff"/> Conectando con ARCA… (puede tardar hasta 60 seg)</> : "Continuar →"}
                  </button>
                </div>
              )}

              {/* ── Phase 2: CAPTCHA + clave ── */}
              {(arcaPhase === "captcha" || arcaPhase === "verifying") && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>

                  {/* CUIT locked */}
                  <div style={{ background: "#f8f7ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>CUIT</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>{cuit}</p>
                    </div>
                    <button onClick={() => { setArcaPhase("cuit"); setArcaErrMsg(""); setArcaError(null); }} style={{ fontSize: 12, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Cambiar</button>
                  </div>

                  {/* CAPTCHA from real ARCA */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Código de seguridad (ARCA)</label>
                      <button onClick={handleRefreshCaptcha} style={{ fontSize: 11, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>🔄 Actualizar</button>
                    </div>
                    {captchaImage && (
                      <div style={{ background: "#f3f4f6", borderRadius: 8, padding: 8, marginBottom: 8, display: "flex", justifyContent: "center" }}>
                        <img src={captchaImage} alt="CAPTCHA de ARCA" style={{ height: 60, imageRendering: "pixelated", borderRadius: 4 }} />
                      </div>
                    )}
                    <input className="input-field" type="text" placeholder="Escribí los caracteres de la imagen" value={captchaSolution}
                      onChange={e => { setCaptchaSolution(e.target.value); setArcaErrMsg(""); }}
                      onKeyDown={e => e.key === "Enter" && handleArcaComplete()}
                      autoComplete="off" autoCorrect="off" spellCheck={false} style={{ letterSpacing: "0.1em", fontFamily: "monospace" }} />
                  </div>

                  {/* Clave fiscal */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: arcaError === "clave" ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Clave Fiscal ARCA</label>
                    <div style={{ position: "relative" }}>
                      <input className="input-field" type={showClave ? "text" : "password"} placeholder="Tu clave fiscal"
                        value={claveFiscal}
                        onChange={e => { setClaveFiscal(e.target.value); setArcaError(null); setArcaErrMsg(""); }}
                        onKeyDown={e => e.key === "Enter" && handleArcaComplete()}
                        style={{ paddingRight: 54, borderColor: arcaError === "clave" ? "#fca5a5" : undefined, background: arcaError === "clave" ? "#fff5f5" : undefined }} />
                      <button onClick={() => setShowClave(!showClave)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>{showClave ? "Ocultar" : "Ver"}</button>
                    </div>
                  </div>

                  {/* Error message */}
                  {arcaErrMsg && (
                    <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px 14px" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", marginBottom: arcaError === "clave" ? 8 : 0 }}>⚠️ {arcaErrMsg}</p>
                      {arcaError === "clave" && (
                        <a href="https://www.arca.gob.ar/clave-fiscal/" target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#7c3aed", textDecoration: "none", background: "#faf5ff", border: "1.5px solid #ddd6fe", borderRadius: 7, padding: "6px 10px", marginTop: 4 }}>
                          🔑 Recuperar clave en ARCA →
                        </a>
                      )}
                    </div>
                  )}

                  <button onClick={handleArcaComplete} disabled={arcaPhase === "verifying" || !claveFiscal || !captchaSolution} className="gradient-btn" style={{
                    width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 16px",
                    cursor: arcaPhase === "verifying" || !claveFiscal || !captchaSolution ? "not-allowed" : "pointer",
                    opacity: !claveFiscal || !captchaSolution ? 0.5 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {arcaPhase === "verifying" ? <><Spinner size={15} color="#fff"/> Verificando en ARCA…</> : "Ingresar a ARCA →"}
                  </button>

                  <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af" }}>
                    ¿Olvidaste tu clave?{" "}
                    <a href="https://www.arca.gob.ar/clave-fiscal/" target="_blank" rel="noopener noreferrer" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Recuperala en ARCA →</a>
                  </p>
                </div>
              )}
            </>) : (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>¡ARCA conectado!</h3>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>Tu cuenta está lista. A partir de ahora todo es automático.</p>
                <button onClick={() => setScreen("app")} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>Empezar →</button>
              </div>
            )}
          </div>
          {!arcaConnected && (
            <p style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={() => setScreen("app")} style={{ fontSize: 12, color: "#d1d5db", background: "none", border: "none", cursor: "pointer" }}>(demo: saltar →)</button>
            </p>
          )}
        </div>
      </div>
    </>
  );

  /* ════════════════════════════════════════
     SCREEN: APP PRINCIPAL
  ════════════════════════════════════════ */
  return (
    <>
      <FontLoader />
      <div style={{ minHeight: "100vh", background: "#f8f7ff" }}>

        {/* ── NAVBAR ── */}
        <nav style={{
          background: "#fff", borderBottom: "1.5px solid #f1f0ff",
          padding: isMobile ? "0 16px" : "0 24px", height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
          boxShadow: "0 1px 12px rgba(124,58,237,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LogoBrand size={isMobile ? 28 : 32} />
            <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
              DEDU<span style={{ color: "#7c3aed" }}>XÍ</span>
            </span>
          </div>

          {/* Step nav — hidden on mobile, bottom nav handles it */}
          <div className="nav-steps">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.15s",
                background: step === i ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
                color: step === i ? "#fff" : "#9ca3af",
                boxShadow: step === i ? "0 2px 12px rgba(124,58,237,0.25)" : "none",
              }}>{s}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="arca-badge" style={{ alignItems: "center", gap: 6, background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 99, padding: "4px 10px" }}>
              <span className="status-dot" style={{ background: "#22c55e" }}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>ARCA conectado</span>
            </div>
            <button onClick={() => { setShowProfilePanel(true); setEditingClave(false); setClaveSaved(false); }} style={{
              width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px rgba(124,58,237,0.3)", flexShrink: 0,
            }}>MP</button>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "20px 14px 120px" : "32px 20px 120px" }}>

          {/* Banner rectificativa */}
          {isRectificativa && step > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, #faf5ff, #ede9fe)", border: "1.5px solid #ddd6fe", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔄</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>Corrección Marzo 2026 · Rectificativa {rectVersion}</p>
                <p style={{ fontSize: 11, color: "#7c3aed", marginTop: 1 }}>Revisá los tickets, actualizá lo que cambió y volvé a presentar.</p>
              </div>
              <button onClick={() => { setIsRectificativa(false); setStep(3); setArcaStatus("sent"); }} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Cancelar</button>
            </div>
          )}

          {/* ── STEP 0: INICIO ── */}
          {step === 0 && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 99, padding: "5px 14px", marginBottom: 14 }}>
                  <span style={{ fontSize: 13 }}>✨</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>Tu asistente de deducciones · Ganancias 2026</span>
                </div>
                <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: "#111827", letterSpacing: "-1px", marginBottom: 10, lineHeight: 1.2 }}>
                  Deducí más.<br/>Pagá menos.
                </h1>
                <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
                  Subí tus tickets, analizamos cuáles aplican y los cargamos en SIRADIG por vos.
                </p>
              </div>

              {/* Stats grid — 4 col desktop / 2 col mobile */}
              <div className="stats-grid">
                {[
                  { label: "Período", value: "Marzo 2026", icon: "📅" },
                  { label: "Tickets cargados", value: tickets.length.toString(), icon: "🧾" },
                  { label: "Deducción aprobada", value: tickets.length > 0 ? fmt(totalApproved) : "—", icon: "✅" },
                  { label: "A confirmar", value: tickets.length > 0 ? fmt(totalPending) : "—", icon: "⏳" },
                ].map((s, i) => (
                  <div key={i} style={{ ...cardStyle, padding: "14px 16px" }}>
                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>{s.label}</p>
                    <p style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: "#111827", marginTop: 2 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar / empty state */}
              {tickets.length === 0 ? (
                <div style={{ ...cardStyle, marginBottom: 20, textAlign: "center", padding: "28px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Todavía no cargaste tickets para Marzo 2026</p>
                  <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>Andá a <strong style={{ color: "#7c3aed" }}>Mis Tickets</strong> para cargar tus comprobantes físicos y analizarlos con IA.</p>
                </div>
              ) : (
                <div style={{ ...cardStyle, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Progreso del mes</span>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{resolvedCount} de {tickets.length} analizados</span>
                  </div>
                  <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", display: "flex", gap: 2 }}>
                    {tickets.length > 0 && <>
                      <div style={{ background: "#10b981", width: `${(tickets.filter(t=>t.status==="approved"||t.status==="loaded").length/tickets.length*100).toFixed(0)}%`, borderRadius: 99 }}/>
                      <div style={{ background: "#ef4444", width: `${(tickets.filter(t=>t.status==="rejected").length/tickets.length*100).toFixed(0)}%`, borderRadius: 99 }}/>
                      <div style={{ background: "#f59e0b", width: `${(tickets.filter(t=>t.status==="pending").length/tickets.length*100).toFixed(0)}%`, borderRadius: 99 }}/>
                    </>}
                  </div>
                  <div style={{ display: "flex", gap: isMobile ? 12 : 20, marginTop: 10, flexWrap: "wrap" }}>
                    {[
                      { color: "#10b981", label: "Aplican", value: fmt(totalApproved) },
                      { color: "#ef4444", label: "No aplican", value: fmt(totalRejected) },
                      { color: "#f59e0b", label: "A confirmar", value: fmt(totalPending) },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="status-dot" style={{ background: r.color }}/>
                        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{r.label} <strong style={{ color: "#374151" }}>{r.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setStep(1)} className="gradient-btn" style={{
                width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer",
              }}>{tickets.length === 0 ? "Cargar mis tickets →" : "Ver mis tickets →"}</button>
            </div>
          )}

          {/* ── STEP 1: UPLOAD / RECT MANAGER ── */}
          {step === 1 && (() => {
            if (isRectificativa) {
              const removedIds = Object.keys(ticketActions).filter(id => ticketActions[id] === "remove").map(Number);
              const editedIds  = Object.keys(ticketEdits).map(Number);
              const changeCount = removedIds.length + editedIds.filter(id => !removedIds.includes(id)).length + addedTickets.length;
              const actionBtn = (label, color, bg, border, onClick) => (
                <button onClick={onClick} style={{ fontSize: 11, fontWeight: 700, color, background: bg, border: `1.5px solid ${border}`, borderRadius: 7, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
              );
              return (
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>Revisá tus tickets</h2>
                  <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Indicá qué cambió respecto a la presentación anterior.</p>

                  <div className="legend-row">
                    {[
                      { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "✓ Mantener" },
                      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "✏️ Editar" },
                      { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "🗑 Eliminar" },
                    ].map((l, i) => (
                      <span key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:l.color, background:l.bg, border:`1px solid ${l.border}`, borderRadius:99, padding:"3px 10px" }}>{l.label}</span>
                    ))}
                  </div>

                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 12 }}>
                    {tickets.map((t, i) => {
                      const action = ticketActions[t.id] || "keep";
                      const isRemoved = action === "remove";
                      const edit = ticketEdits[t.id] || {};
                      const isEditing = editingTicketId === t.id;
                      const cfg = statusConfig[t.status] || statusConfig["pending"];
                      return (
                        <div key={t.id} style={{ borderBottom: i < tickets.length - 1 ? "1px solid #f5f3ff" : "none", opacity: isRemoved ? 0.4 : 1, transition: "opacity 0.2s", background: isRemoved ? "#fef2f2" : isEditing ? "#faf5ff" : i % 2 === 0 ? "#fff" : "#faf9ff" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                            <span className="status-dot" style={{ background: cfg.dot }}/>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isRemoved ? "line-through" : "none" }}>{t.provider}</p>
                              <p style={{ fontSize: 11, color: "#9ca3af" }}>{edit.date || t.date} · {edit.amount ? fmt(Number(edit.amount)) : fmt(t.amount)}</p>
                            </div>
                            {!isRemoved && !isEditing && (
                              <div className="ticket-actions">
                                {actionBtn("✏️ Editar", "#d97706", "#fffbeb", "#fde68a", () => { setEditingTicketId(t.id); setTicketEdits(e => ({ ...e, [t.id]: { amount: t.amount, date: t.date, ...e[t.id] } })); })}
                                {actionBtn("🗑 Eliminar", "#dc2626", "#fef2f2", "#fecaca", () => { setTicketActions(a => ({ ...a, [t.id]: "remove" })); setEditingTicketId(null); })}
                              </div>
                            )}
                            {isRemoved && actionBtn("↩ Restaurar", "#6b7280", "#f9fafb", "#e5e7eb", () => setTicketActions(a => { const n = { ...a }; delete n[t.id]; return n; }))}
                          </div>
                          {isEditing && (
                            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                              <div className="form-row-2">
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Fecha</label>
                                  <input className="input-field" type="text" placeholder="DD/MM/AAAA" value={ticketEdits[t.id]?.date || ""} onChange={e => setTicketEdits(ed => ({ ...ed, [t.id]: { ...ed[t.id], date: e.target.value } }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Monto ($)</label>
                                  <input className="input-field" type="number" value={ticketEdits[t.id]?.amount || ""} onChange={e => setTicketEdits(ed => ({ ...ed, [t.id]: { ...ed[t.id], amount: e.target.value } }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setEditingTicketId(null)} style={{ flex: 1, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>Cancelar</button>
                                <button onClick={() => setEditingTicketId(null)} className="gradient-btn" style={{ flex: 1, color: "#fff", fontWeight: 700, fontSize: 12, border: "none", borderRadius: 8, padding: "8px", cursor: "pointer" }}>Guardar cambio</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {addedTickets.length > 0 && (
                    <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ padding: "10px 16px", borderBottom: "1.5px solid #f5f3ff", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>➕ Tickets nuevos</span>
                        <span style={{ fontSize: 10, background: "#faf5ff", border: "1px solid #ddd6fe", color: "#7c3aed", borderRadius: 99, padding: "1px 8px", fontWeight: 700 }}>{addedTickets.length}</span>
                      </div>
                      {addedTickets.map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: i < addedTickets.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                          <span style={{ fontSize: 16 }}>🧾</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider || "Nuevo ticket"}</p>
                            <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} · {t.type}</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>{t.amount ? fmt(Number(t.amount)) : "—"}</span>
                          <button onClick={() => setAddedTickets(a => a.filter((_, j) => j !== i))} style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddTicket && (
                    <div style={{ ...cardStyle, marginBottom: 12, background: "#faf5ff", border: "1.5px solid #ddd6fe" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", marginBottom: 14 }}>➕ Agregar ticket nuevo</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="form-row-2">
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Proveedor</label>
                            <input className="input-field" placeholder="Nombre o razón social" value={newTicketForm.provider} onChange={e => setNewTicketForm(f => ({ ...f, provider: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Fecha</label>
                            <input className="input-field" placeholder="DD/MM/AAAA" value={newTicketForm.date} onChange={e => setNewTicketForm(f => ({ ...f, date: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                        </div>
                        <div className="form-row-3">
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Tipo</label>
                            <select className="input-field" value={newTicketForm.type} onChange={e => setNewTicketForm(f => ({ ...f, type: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }}>
                              {["Factura A","Factura B","Factura C","Ticket"].map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>N° comprobante</label>
                            <input className="input-field" placeholder="0001-00001234" value={newTicketForm.number} onChange={e => setNewTicketForm(f => ({ ...f, number: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Monto ($)</label>
                            <input className="input-field" type="number" placeholder="0.00" value={newTicketForm.amount} onChange={e => setNewTicketForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setShowAddTicket(false); setNewTicketForm({ provider: "", date: "", amount: "", number: "", type: "Factura B" }); }} style={{ flex: 1, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>Cancelar</button>
                          <button onClick={() => { if (!newTicketForm.provider && !newTicketForm.amount) return; setAddedTickets(a => [...a, { ...newTicketForm }]); setShowAddTicket(false); setNewTicketForm({ provider: "", date: "", amount: "", number: "", type: "Factura B" }); }} className="gradient-btn" style={{ flex: 2, color: "#fff", fontWeight: 700, fontSize: 12, border: "none", borderRadius: 8, padding: "9px", cursor: "pointer" }}>Agregar ticket</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!showAddTicket && (
                    <button onClick={() => setShowAddTicket(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", border: "1.5px dashed #ddd6fe", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, color: "#7c3aed", cursor: "pointer", marginBottom: 16 }}>➕ Agregar ticket nuevo</button>
                  )}

                  {changeCount > 0 && (
                    <div style={{ background: "#faf5ff", border: "1.5px solid #ddd6fe", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                      <div className="change-summary">
                        <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 700 }}>Cambios:</span>
                        {removedIds.length > 0 && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>🗑 {removedIds.length} eliminado{removedIds.length > 1 ? "s" : ""}</span>}
                        {editedIds.filter(id => !removedIds.includes(id)).length > 0 && <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>✏️ {editedIds.filter(id => !removedIds.includes(id)).length} editado{editedIds.length > 1 ? "s" : ""}</span>}
                        {addedTickets.length > 0 && <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>➕ {addedTickets.length} nuevo{addedTickets.length > 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                  )}

                  <button onClick={() => { setAnalyzing(true); setTimeout(() => { setTickets(prev => prev.map(t => ({ ...t, ...classifyTicket(t) }))); setAnalyzing(false); setAnalyzed(true); setStep(2); }, 2200); }} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer" }}>🤖 Analizar cambios con IA →</button>
                  {analyzing && (
                    <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "20px", textAlign: "center", marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: `bounce 0.8s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}/>)}
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Re-analizando con los cambios aplicados…</p>
                    </div>
                  )}
                </div>
              );
            }

            // ── MODO NORMAL: mis tickets ──
            const handleAddTicket = () => {
              const f = newTicketForm;
              if (!f.provider || !f.amount) return;
              const newT = {
                id: Date.now(),
                date: f.date || new Date().toLocaleDateString("es-AR"),
                provider: f.provider.toUpperCase(),
                cuit: f.cuitProv || "—",
                number: f.number || "—",
                type: f.type,
                amount: parseFloat(f.amount),
                status: "pending",
                reason: "Pendiente de análisis IA",
              };
              setTickets(prev => [...prev, newT]);
              setShowAddTicket(false);
              setNewTicketForm({ provider: "", cuitProv: "", date: "", amount: "", number: "", type: "Factura B" });
            };
            const handleRemoveTicket = (id) => setTickets(prev => prev.filter(t => t.id !== id));
            const handleAnalyze = () => {
              if (tickets.length === 0) return;
              setAnalyzing(true);
              setTimeout(() => {
                setTickets(prev => prev.map(t => ({ ...t, ...classifyTicket(t) })));
                setAnalyzing(false);
                setAnalyzed(true);
                setStep(2);
              }, 2200);
            };

            return (
              <div>
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>Mis Tickets — Marzo 2026</h2>
                <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Cargá tus comprobantes físicos y los analizamos con IA.</p>

                {/* ARCA section */}
                <div style={{ ...cardStyle, marginBottom: 16, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🔍 Comprobantes en ARCA</span>
                    <span className="chip" style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>Conectado</span>
                  </div>
                  <div style={{ background: "#f8f7ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>ℹ️</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6", marginBottom: 3 }}>0 comprobantes de terceros encontrados para Marzo 2026</p>
                      <p style={{ fontSize: 11, color: "#7c3aed", lineHeight: 1.5 }}>ARCA no tiene comprobantes nuevos registrados en tu CUIT este mes. Podés cargar tus tickets físicos acá abajo.</p>
                    </div>
                  </div>
                </div>

                {/* Physical tickets */}
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1.5px solid #f5f3ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🧾 Tickets físicos</span>
                      {tickets.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#faf5ff", border: "1px solid #ddd6fe", borderRadius: 99, padding: "1px 8px" }}>{tickets.length}</span>}
                    </div>
                    <button onClick={() => setShowAddTicket(v => !v)} className={showAddTicket ? "" : "gradient-btn"} style={{ fontSize: 12, fontWeight: 700, color: showAddTicket ? "#9ca3af" : "#fff", background: showAddTicket ? "#f3f4f6" : undefined, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                      {showAddTicket ? "✕ Cancelar" : "➕ Agregar ticket"}
                    </button>
                  </div>

                  {/* Add ticket form */}
                  {showAddTicket && (
                    <div style={{ padding: "14px 16px", background: "#faf5ff", borderBottom: "1.5px solid #ede9fe" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 12 }}>Datos del comprobante</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div className="form-row-2">
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Proveedor / Razón social *</label>
                            <input className="input-field" placeholder="Ej: ASELLO TECH S.R.L." value={newTicketForm.provider} onChange={e => setNewTicketForm(f => ({ ...f, provider: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>CUIT proveedor</label>
                            <input className="input-field" placeholder="30-00000000-0" value={newTicketForm.cuitProv} onChange={e => setNewTicketForm(f => ({ ...f, cuitProv: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                        </div>
                        <div className="form-row-3">
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Fecha</label>
                            <input className="input-field" placeholder="DD/MM/AAAA" value={newTicketForm.date} onChange={e => setNewTicketForm(f => ({ ...f, date: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Tipo</label>
                            <select className="input-field" value={newTicketForm.type} onChange={e => setNewTicketForm(f => ({ ...f, type: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }}>
                              {["Factura A","Factura B","Factura C","Ticket","Recibo"].map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Monto ($) *</label>
                            <input className="input-field" type="number" placeholder="0.00" value={newTicketForm.amount} onChange={e => setNewTicketForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>N° comprobante (opcional)</label>
                          <input className="input-field" placeholder="0001-00001234" value={newTicketForm.number} onChange={e => setNewTicketForm(f => ({ ...f, number: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                        </div>
                        <button onClick={handleAddTicket} disabled={!newTicketForm.provider || !newTicketForm.amount} className="gradient-btn" style={{ color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 8, padding: "10px", cursor: !newTicketForm.provider || !newTicketForm.amount ? "not-allowed" : "pointer", opacity: !newTicketForm.provider || !newTicketForm.amount ? 0.5 : 1 }}>
                          ✓ Agregar ticket
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ticket list */}
                  {tickets.length === 0 && !showAddTicket ? (
                    <div style={{ padding: "24px 16px", textAlign: "center" }}>
                      <p style={{ fontSize: 13, color: "#9ca3af" }}>Todavía no cargaste tickets. Usá el botón <strong style={{ color: "#7c3aed" }}>Agregar ticket</strong> para empezar.</p>
                    </div>
                  ) : (
                    tickets.map((t, i) => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i % 2 === 0 ? "#fff" : "#faf9ff", borderBottom: i < tickets.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                        <span style={{ fontSize: 16 }}>🧾</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} · {t.type} · {t.cuit}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>{fmt(t.amount)}</span>
                        <button onClick={() => handleRemoveTicket(t.id)} style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>✕</button>
                      </div>
                    ))
                  )}
                </div>

                {/* Drag & drop area for scanning */}
                <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); setShowAddTicket(true); }} style={{
                  border: `2px dashed ${dragging ? "#7c3aed" : "#e5e3ff"}`, borderRadius: 12, padding: "20px 16px",
                  textAlign: "center", cursor: "pointer", background: dragging ? "#faf5ff" : "#fafafa", transition: "all 0.2s", marginBottom: 20,
                  }} onClick={() => setShowAddTicket(true)}>
                  <p style={{ fontSize: 13, color: "#9ca3af" }}>📷 Arrastrá la foto de un ticket para cargarlo</p>
                  <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 4 }}>JPG · PNG · PDF — próximamente con OCR automático</p>
                </div>

                {tickets.length > 0 && !analyzing && (
                  <button onClick={handleAnalyze} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer" }}>
                    🤖 Analizar {tickets.length} ticket{tickets.length > 1 ? "s" : ""} con IA →
                  </button>
                )}
                {analyzing && (
                  <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: `bounce 0.8s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}/>)}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Analizando con IA… procesando {tickets.length} ticket{tickets.length > 1 ? "s" : ""}…</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── STEP 2: ANÁLISIS ── */}
          {step === 2 && (() => {
            if (!analyzed && tickets.length === 0) return (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🤖</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Todavía no analizaste tickets</h2>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20, lineHeight: 1.6 }}>Primero cargá tus comprobantes en <strong style={{ color: "#7c3aed" }}>Mis Tickets</strong> y luego hacé clic en "Analizar con IA".</p>
                <button onClick={() => setStep(1)} className="gradient-btn" style={{ color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer" }}>Ir a Mis Tickets →</button>
              </div>
            );
            const statusOrder = { approved: 0, loaded: 1, pending: 2, rejected: 3 };
            const sorted = [...tickets].sort((a, b) => (statusOrder[a.status]??2) - (statusOrder[b.status]??2));
            const groups = [
              { key: "approved", label: "✅ Aplican como deducción", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", tickets: sorted.filter(t => t.status === "approved" || t.status === "loaded") },
              { key: "pending",  label: "⏳ A confirmar",            color: "#d97706", bg: "#fffbeb", border: "#fde68a", tickets: sorted.filter(t => t.status === "pending") },
              { key: "rejected", label: "❌ No aplican",             color: "#dc2626", bg: "#fef2f2", border: "#fecaca", tickets: sorted.filter(t => t.status === "rejected") },
            ];
            const analyzedTickets = tickets.filter(t => t.status !== "pending" || t.reason !== "Pendiente de análisis IA");
            const wikiItems = [
              { icon: "🖥️", title: "Equipamiento de trabajo", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", body: "Computadoras, monitores, teclados, auriculares, sillas ergonómicas, escritorios y cualquier elemento que uses para trabajar. Aplica tanto para trabajo en oficina como home office." },
              { icon: "📱", title: "Tecnología y software", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", body: "Celulares de uso laboral, tablets, suscripciones a software profesional (Adobe, Office, etc.), hosting, dominios. Debe poder justificarse como herramienta de trabajo." },
              { icon: "🛒", title: "Supermercados y alimentos", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", body: "Aunque trabajes desde casa, la comida no es deducible como equipamiento. La normativa SIRADIG limita la deducción a indumentaria y equipamiento, no a gastos de vida." },
              { icon: "🚗", title: "Peajes, combustible y transporte", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", body: "Los peajes y gastos de movilidad no entran en la categoría de equipamiento o indumentaria. Podrían deducirse por otra vía si el empleador los incluye, pero no por esta." },
              { icon: "👤", title: "Personas físicas", color: "#d97706", bg: "#fffbeb", border: "#fde68a", body: "Cuando el proveedor es una persona física, hay que confirmar el rubro. Si es un profesional de tecnología o diseño puede aplicar. Si es un particular sin relación laboral, no." },
              { icon: "🛍️", title: "Marketplaces (MercadoLibre, etc.)", color: "#d97706", bg: "#fffbeb", border: "#fde68a", body: "Lo que importa es qué compraste. Si fue equipamiento de trabajo (notebook, silla, etc.), aplica. Si fue ropa casual o alimentos, no." },
            ];
            return (
              <div>
                <div className="analysis-header">
                  <div>
                    <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 2 }}>Análisis de deducciones</h2>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>IA evaluó cada ticket según normativa SIRADIG 2026</p>
                  </div>
                  <div className="total-block" style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deducción total</p>
                    <p style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "#059669", letterSpacing: "-1px" }}>{fmt(totalApproved)}</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
                  {groups.filter(g => g.tickets.length > 0).map(group => (
                    <div key={group.key}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: group.color }}>{group.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: group.color, background: group.bg, border: `1px solid ${group.border}`, borderRadius: 99, padding: "1px 8px", flexShrink: 0 }}>{group.tickets.length} ticket{group.tickets.length > 1 ? "s" : ""}</span>
                        <div style={{ flex: 1, height: 1, background: group.border }}/>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {group.tickets.map(t => {
                          const cfg = statusConfig[t.status];
                          return (
                            <div key={t.id} style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: 12, padding: "13px 16px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                                  <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{t.date} · {t.type}</p>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0 }}>{fmt(t.amount)}</span>
                              </div>
                              <p style={{ fontSize: 12, color: cfg.text, marginTop: 7 }}>💬 {t.reason}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ ...cardStyle, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Resumen para SIRADIG</p>
                  {[
                    { label: "✅ Aplican (cargar)", value: fmt(totalApproved), color: "#059669" },
                    { label: "❌ No aplican", value: fmt(totalRejected), color: "#dc2626" },
                    { label: "❓ A confirmar", value: fmt(totalPending), color: "#d97706" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f5f3ff" : "none" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                <details style={{ marginBottom: 20 }}>
                  <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8, background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6d28d9", userSelect: "none" }}>
                    <span style={{ fontSize: 16 }}>📖</span>
                    ¿Por qué aplica o no cada gasto?
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: "#a78bfa" }}>Ver →</span>
                  </summary>
                  <div style={{ border: "1.5px solid #ede9fe", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
                    {wikiItems.map((w, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderBottom: i < wikiItems.length - 1 ? "1px solid #f5f3ff" : "none", background: i % 2 === 0 ? "#fff" : "#fdfcff", display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: w.bg, border: `1.5px solid ${w.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{w.icon}</div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: w.color, marginBottom: 3 }}>{w.title}</p>
                          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{w.body}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: "12px 16px", background: "#faf5ff", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>⚖️</span>
                      <p style={{ fontSize: 11, color: "#7c3aed", lineHeight: 1.6, fontStyle: "italic" }}>Basado en el Art. 82 inc. h) de la Ley de Impuesto a las Ganancias y la RG AFIP 4003/2017. Ante dudas, consultá con tu contador.</p>
                    </div>
                  </div>
                </details>

                <button onClick={() => setStep(3)} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer" }}>Presentar en ARCA →</button>
              </div>
            );
          })()}

          {/* ── STEP 3: PRESENTAR EN ARCA ── */}
          {step === 3 && (() => {
            const statuses = [
              { key: "pending",       label: "No iniciado", icon: "○",  desc: "Todavía no subiste tickets este mes.",              bg: "#f3f4f6", txt: "#6b7280", border: "#e5e7eb", accent: "#9ca3af" },
              { key: "draft",         label: "Borrador",    icon: "✏️", desc: "Cargado en ARCA. Pendiente de enviar al empleador.", bg: "#fffbeb", txt: "#d97706", border: "#fde68a", accent: "#f59e0b" },
              { key: "sent",          label: "Enviado",     icon: "✅", desc: "Tu empleador recibió las deducciones del mes.",     bg: "#ecfdf5", txt: "#059669", border: "#a7f3d0", accent: "#10b981" },
              { key: "rectificativa", label: "Corrección",  icon: "🔄", desc: "Se presentó una corrección al mes anterior.",      bg: "#faf5ff", txt: "#7c3aed", border: "#ddd6fe", accent: "#7c3aed" },
            ];
            const curIdx = statuses.findIndex(s => s.key === arcaStatus);
            const cur = statuses[curIdx];
            return (
              <div>
                {/* Demo banner */}
                <div style={{ background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1.5px solid #fde68a", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🧪</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>Versión demo — flujo simulado</p>
                    <p style={{ fontSize: 11, color: "#b45309", lineHeight: 1.5 }}>En producción, los botones "Cargar en ARCA" y "Enviar al empleador" se conectan directamente a AFIP/ARCA con tu clave fiscal. Acá simulan el flujo para que puedas ver cómo funciona.</p>
                  </div>
                </div>
                {/* Timeline */}
                <div style={{ ...cardStyle, marginBottom: 20, padding: "20px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
                    {statuses.map((s, i) => {
                      const isActive = s.key === arcaStatus;
                      const isPast = i < curIdx;
                      return (
                        <div key={s.key} className="timeline-node" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
                          {i < statuses.length - 1 && <div style={{ position: "absolute", top: 16, left: "50%", width: "100%", height: 2, background: isPast || isActive ? "linear-gradient(90deg, #c4b5fd, #a5b4fc)" : "#f3f4f6", zIndex: 0 }}/>}
                          <div style={{ width: 34, height: 34, borderRadius: "50%", zIndex: 1, background: isActive ? `linear-gradient(135deg, ${s.accent}22, ${s.accent}33)` : isPast ? "#f3f4f6" : "#f9fafb", border: `2px solid ${isActive ? s.accent : isPast ? "#e5e7eb" : "#f3f4f6"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.2s", boxShadow: isActive ? `0 0 0 4px ${s.accent}18` : "none", transform: isActive ? "scale(1.1)" : "scale(1)" }}>{s.icon}</div>
                          <span className="node-label" style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: isActive ? s.txt : "#9ca3af", textAlign: "center", lineHeight: 1.3 }}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: cur.bg, border: `1.5px solid ${cur.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: cur.txt }}>{cur.desc}</div>
                </div>

                {/* Resumen */}
                <div style={{ ...cardStyle, marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Marzo 2026</p>
                  {[
                    { label: "Tickets deducidos", value: tickets.filter(t => t.status === "approved" || t.status === "loaded").length.toString() },
                    { label: "Total deducción", value: fmt(totalApproved), bold: true, color: "#059669", size: 18 },
                    isRectificativa && { label: "Versión", value: null, chip: `Rectificativa ${rectVersion}`, chipBg: "#faf5ff", chipColor: "#7c3aed", chipBorder: "#ddd6fe" },
                    { label: "Estado", value: null, chip: arcaStatus === "pending" ? "No iniciado" : arcaStatus === "draft" ? "Borrador · No enviado" : arcaStatus === "sent" ? "Enviado" : "Corrección enviada", chipBg: cur.bg, chipColor: cur.txt, chipBorder: cur.border },
                  ].filter(Boolean).map((r, i, arr) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{r.label}</span>
                      {r.chip ? <span className="chip" style={{ background: r.chipBg, color: r.chipColor, border: `1px solid ${r.chipBorder}` }}>{r.chip}</span>
                               : <span style={{ fontSize: r.size || 14, fontWeight: r.bold ? 800 : 600, color: r.color || "#111827" }}>{r.value}</span>}
                    </div>
                  ))}
                </div>

                {presenting && (
                  <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 14, padding: "24px", textAlign: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Spinner size={28} color="#7c3aed"/></div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#6d28d9", marginBottom: 12 }}>Cargando en ARCA…</p>
                    <div style={{ height: 5, background: "#ede9fe", borderRadius: 99, overflow: "hidden", maxWidth: 240, margin: "0 auto" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #4f46e5)", borderRadius: 99, transition: "width 0.1s", width: `${presentProgress}%` }}/>
                    </div>
                  </div>
                )}

                {rectifying && (
                  <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 14, padding: "24px", textAlign: "center", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Spinner size={28} color="#7c3aed"/></div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#6d28d9" }}>Presentando corrección en ARCA…</p>
                  </div>
                )}

                {!presenting && !rectifying && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {arcaStatus === "pending" && (
                      <button onClick={handlePresent} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "15px", cursor: "pointer" }}>
                        {isRectificativa ? `Presentar Rectificativa ${rectVersion} →` : "Cargar en ARCA"}
                      </button>
                    )}
                    {arcaStatus === "draft" && (<>
                      <button onClick={() => { setArcaStatus("sent"); setIsRectificativa(false); }} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "15px", cursor: "pointer" }}>
                        {isRectificativa ? `Enviar Rectificativa ${rectVersion} →` : "Enviar al empleador →"}
                      </button>
                      <button onClick={() => setShowRectModal(true)} style={{ width: "100%", background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 13, border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px", cursor: "pointer" }}>¿Necesitás corregir algo?</button>
                    </>)}
                    {arcaStatus === "sent" && (<>
                      <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", border: "1.5px solid #a7f3d0", borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
                        <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#065f46", marginBottom: 2 }}>¡Presentación enviada!</p>
                        <p style={{ fontSize: 13, color: "#059669" }}>Tu empleador ya recibió las deducciones de Marzo 2026.</p>
                      </div>

                      <div style={{ background: "linear-gradient(135deg, #faf5ff, #ede9fe)", border: "1.5px solid #ddd6fe", borderRadius: 14, padding: "16px 20px" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>💰 Tu ahorro estimado este mes</p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, color: "#5b21b6", letterSpacing: "-1.5px", lineHeight: 1 }}>{fmt(monthlySaving)}</span>
                          <span style={{ fontSize: 12, color: "#a78bfa", marginBottom: 4, fontWeight: 600 }}>menos de impuesto</span>
                        </div>
                        <div className="savings-detail" style={{ color: "#7c3aed", background: "rgba(124,58,237,0.06)", borderRadius: 8, padding: "8px 10px" }}>
                          <span>Base deducida: <strong>{fmt(totalApproved)}</strong></span>
                          <span>Tasa marginal: <strong>27%</strong></span>
                        </div>
                        <p style={{ fontSize: 10, color: "#c4b5fd", marginTop: 8, lineHeight: 1.5 }}>Estimación basada en Ganancias 4ta categoría. El ahorro real puede variar según tu sueldo bruto.</p>
                      </div>

                      <button onClick={() => alert("📄 Generando PDF...")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                        <span style={{ fontSize: 16 }}>📄</span> Descargar comprobante PDF
                      </button>

                      <div style={{ background: "#fff", border: "1.5px solid #f1f0ff", borderRadius: 14, padding: "16px 18px" }}>
                        {!rrhhSaved ? (<>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>¿Querés que lo hagamos nosotros cada mes?</p>
                          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14, lineHeight: 1.6 }}>Dejanos el email de tu área de RRHH y nos encargamos de enviar la declaración todos los meses.</p>
                          <div className="rrhh-row">
                            <input className="input-field" type="email" placeholder="rrhh@empresa.com" value={rrhhEmail} onChange={e => setRrhhEmail(e.target.value)} style={{ flex: 1, padding: "9px 12px", fontSize: 13 }} />
                            <button onClick={() => { if (!rrhhEmail) return; setSavingRrhh(true); setTimeout(() => { setSavingRrhh(false); setRrhhSaved(true); }, 1400); }} disabled={savingRrhh || !rrhhEmail} className="gradient-btn" style={{ color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 10, padding: "9px 16px", cursor: !rrhhEmail ? "not-allowed" : "pointer", opacity: !rrhhEmail ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap" }}>
                              {savingRrhh ? <><Spinner size={13} color="#fff"/> Guardando</> : "Guardar ✓"}
                            </button>
                          </div>
                        </>) : (
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>✉️</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 1 }}>¡Listo! Nos encargamos el mes que viene.</p>
                              <p style={{ fontSize: 11, color: "#9ca3af" }}>Enviaremos a <strong style={{ color: "#7c3aed" }}>{rrhhEmail}</strong> automáticamente.</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <button onClick={() => setShowRectModal(true)} style={{ width: "100%", background: "none", border: "none", fontSize: 12, color: "#9ca3af", cursor: "pointer", padding: "4px" }}>¿Necesitás corregir algo? →</button>
                    </>)}
                  </div>
                )}

                <button onClick={() => { setArcaStatus("pending"); setPresenting(false); setPresentProgress(0); setAnalyzed(false); setTickets([]); setStep(1); }} style={{ width: "100%", background: "none", border: "none", fontSize: 11, color: "#d1d5db", marginTop: 24, cursor: "pointer" }}>↺ Reiniciar mes (borrar tickets)</button>

                {showRectModal && (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(15,12,41,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={() => setShowRectModal(false)}>
                    <div style={{ background: "#fff", borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 360, boxShadow: "0 -8px 60px rgba(15,12,41,0.2)" }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Presentar corrección</h3>
                      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>Podés corregir o agregar deducciones en cualquier momento del año fiscal. Actualizamos todo en ARCA por vos.</p>
                      <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#6d28d9", marginBottom: 20, lineHeight: 1.6 }}>💡 La rectificativa reemplaza lo anterior. Tu empleador recibirá la versión actualizada.</div>
                      <button onClick={handleRectificar} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", marginBottom: 10 }}>Sí, corregir este mes</button>
                      <button onClick={() => setShowRectModal(false)} style={{ width: "100%", background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", padding: "8px" }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── PROFILE PANEL ── */}
        {showProfilePanel && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,12,41,0.4)", zIndex: 50, display: "flex", justifyContent: "flex-end", alignItems: "flex-start", padding: "68px 16px 16px" }} onClick={() => setShowProfilePanel(false)}>
            <div style={{ background: "#fff", borderRadius: 18, padding: "20px", width: "100%", maxWidth: 280, boxShadow: "0 8px 48px rgba(15,12,41,0.15)", border: "1.5px solid #f1f0ff" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, borderBottom: "1.5px solid #f5f3ff", marginBottom: 16 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>MP</div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Marisol Pérez</p>
                  <p style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>mfmarisoll@gmail.com</p>
                </div>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Cuenta ARCA</p>
              <div style={{ background: "#f8f7ff", border: "1.5px solid #f1f0ff", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>CUIT</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", fontWeight: 600 }}>{cuit || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Clave fiscal</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151" }}>••••••••</span>
                </div>
              </div>
              {claveSaved && <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "#059669", marginBottom: 10 }}>✅ Clave actualizada</div>}
              {!editingClave ? (
                <button onClick={() => setEditingClave(true)} style={{ width: "100%", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>🔑 Actualizar clave fiscal</button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ position: "relative" }}>
                    <input className="input-field" type={showNewClave ? "text" : "password"} placeholder="Nueva clave fiscal" value={newClaveFiscal} onChange={e => setNewClaveFiscal(e.target.value)} style={{ paddingRight: 48 }} autoFocus />
                    <button onClick={() => setShowNewClave(!showNewClave)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 10, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>{showNewClave ? "Ocultar" : "Ver"}</button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingClave(false); setNewClaveFiscal(""); }} style={{ flex: 1, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={handleUpdateClave} disabled={savingClave || !newClaveFiscal} className="gradient-btn" style={{ flex: 1, color: "#fff", fontWeight: 700, fontSize: 12, border: "none", borderRadius: 8, padding: "8px", cursor: "pointer", opacity: !newClaveFiscal ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      {savingClave ? <><Spinner size={12} color="#fff"/> Guardando</> : "Guardar"}
                    </button>
                  </div>
                </div>
              )}
              <div style={{ borderTop: "1.5px solid #f5f3ff", marginTop: 16, paddingTop: 14 }}>
                <button onClick={() => { setShowProfilePanel(false); ["deduxi_screen","deduxi_cuit","deduxi_tickets","deduxi_arca_fetched"].forEach(k => localStorage.removeItem(k)); setTickets([]); setArcaFetched(false); setScreen("login"); }} style={{ width: "100%", background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontWeight: 500 }}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM NAV ── */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1.5px solid #f1f0ff", display: "flex", zIndex: 30 }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, padding: "10px 4px", border: "none", background: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: step === i ? "#7c3aed" : "#9ca3af", fontSize: 11, fontWeight: 600, transition: "color 0.15s",
            }}>
              <span style={{ fontSize: 16 }}>{["◈","⊞","◎","⬡"][i]}</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
