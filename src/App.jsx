import { useState } from "react";

/* ── Google Font: Inter ── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { font-family: 'Inter', system-ui, sans-serif; }
    .gradient-btn {
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      box-shadow: 0 4px 24px 0 rgba(124,58,237,0.25);
    }
    .gradient-btn:hover {
      background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
      box-shadow: 0 6px 28px 0 rgba(124,58,237,0.35);
    }
    .gradient-hero {
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
    }
    .card-glass {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.6);
    }
    .subtle-grid {
      background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
      background-size: 24px 24px;
    }
    .brand-glow {
      box-shadow: 0 0 0 3px rgba(124,58,237,0.15), 0 4px 20px rgba(124,58,237,0.2);
    }
    .input-field {
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 11px 16px;
      font-size: 14px;
      color: #111827;
      width: 100%;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
      background: #fafafa;
    }
    .input-field:focus {
      border-color: #7c3aed;
      box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
      background: #fff;
    }
    .input-field::placeholder { color: #9ca3af; }
    .status-dot { display:inline-block; width:7px; height:7px; border-radius:50%; }
    .chip {
      display:inline-flex; align-items:center; gap:5px;
      padding: 3px 10px; border-radius:99px; font-size:12px; font-weight:600;
    }
  `}</style>
);

/* ── Data ── */
const mockTickets = [
  { id: 1, date: "01/03/2026", provider: "COTO CICSA",            cuit: "30-54808315-6", number: "2045-07481302", type: "Factura B", amount: 29497.39, status: "loaded",   reason: "Ya cargado en SIRADIG" },
  { id: 2, date: "02/03/2026", provider: "BURD JULIETA TAMARA",   cuit: "27-31200456-9", number: "2311-00048917", type: "Factura B", amount: 16000.00, status: "pending",  reason: "Persona física – confirmar rubro" },
  { id: 3, date: "05/03/2026", provider: "AUTOPISTAS URBANAS S.A.",cuit: "30-70815738-4", number: "5031-01269079", type: "Factura B", amount: 18381.81, status: "rejected", reason: "Peajes – no aplica como equipamiento" },
  { id: 4, date: "09/03/2026", provider: "LEVY IOSEF",             cuit: "20-18765432-1", number: "0006-00804967", type: "Factura B", amount: 13449.00, status: "pending",  reason: "Persona física – confirmar rubro" },
  { id: 5, date: "09/03/2026", provider: "ASELLO TECH S.R.L.",     cuit: "30-71445324-7", number: "0002-00054390", type: "Factura B", amount: 14999.00, status: "approved", reason: "Empresa de tecnología – aplica" },
  { id: 6, date: "09/03/2026", provider: "MERCADOLIBRE S.R.L.",    cuit: "30-70308853-4", number: "0037-37709171", type: "Factura B", amount: 3490.00,  status: "approved", reason: "E-commerce – aplica si fue equipamiento" },
  { id: 7, date: "09/03/2026", provider: "PAIK MATEO PABLO",       cuit: "20-29876543-8", number: "0010-00015601", type: "Factura B", amount: 39597.00, status: "pending",  reason: "Persona física – confirmar rubro" },
];

const steps = ["Inicio", "Mis Tickets", "Análisis IA", "Presentar en ARCA"];
const stepIcons = ["◈", "⊞", "◎", "⬡"];

const statusConfig = {
  approved: { label: "Aplica",       bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", dot: "#10b981" },
  rejected: { label: "No aplica",    bg: "#fef2f2", text: "#dc2626", border: "#fecaca", dot: "#ef4444" },
  pending:  { label: "A confirmar",  bg: "#fffbeb", text: "#d97706", border: "#fde68a", dot: "#f59e0b" },
  loaded:   { label: "Cargado",      bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", dot: "#3b82f6" },
};

const fmt = (n) => "$\u00a0" + n.toLocaleString("es-AR", { minimumFractionDigits: 2 });

/* ── Icons ── */
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

// LOGO VARIANT — cambiar entre "X" | "arrow" | "percent" para probar
const LOGO_VARIANT = "X";

const LogoBrand = ({ size = 32 }) => {
  const base = {
    width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 14px rgba(124,58,237,0.4)",
  };

  // Opción A · X mark — la letra clave del nombre, bold y tech
  if (LOGO_VARIANT === "X") return (
    <div style={base}>
      <svg viewBox="0 0 20 20" width={size * 0.52} height={size * 0.52} fill="none">
        <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
        <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" stroke="white" strokeWidth="2.8" strokeLinecap="round"/>
        <line x1="2" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </div>
  );

  // Opción B · Flecha abajo — "deducir = reducir, bajar"
  if (LOGO_VARIANT === "arrow") return (
    <div style={{ ...base, background: "linear-gradient(135deg, #6d28d9, #7c3aed)" }}>
      <svg viewBox="0 0 20 20" width={size * 0.55} height={size * 0.55} fill="none">
        <path d="M10 3v11" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M5.5 9.5L10 15l4.5-5.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );

  // Opción C · % estilizado — referencia impuestos/deducciones, moderno
  if (LOGO_VARIANT === "percent") return (
    <div style={{ ...base, background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
      <svg viewBox="0 0 20 20" width={size * 0.55} height={size * 0.55} fill="none">
        <circle cx="6.5" cy="6.5" r="2.2" stroke="white" strokeWidth="1.8"/>
        <circle cx="13.5" cy="13.5" r="2.2" stroke="white" strokeWidth="1.8"/>
        <line x1="15" y1="5" x2="5" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </div>
  );

  return <div style={base}/>;
};

const Spinner = ({ size = 18, color = "#7c3aed" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    border: `2.5px solid ${color}22`,
    borderTopColor: color,
    animation: "spin 0.7s linear infinite",
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
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
  // Gestor de tickets para rectificativa
  // ticketActions: { [id]: "keep" | "remove" }
  const [ticketActions, setTicketActions] = useState({});
  // edits inline: { [id]: { amount, date } }
  const [ticketEdits, setTicketEdits] = useState({});
  const [editingTicketId, setEditingTicketId] = useState(null);
  // tickets nuevos agregados manualmente en rectificativa
  const [addedTickets, setAddedTickets] = useState([]);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ provider: "", date: "", amount: "", number: "", type: "Factura B" });
  // Delegación RRHH
  const [rrhhEmail, setRrhhEmail] = useState("");
  const [rrhhSaved, setRrhhSaved] = useState(false);
  const [savingRrhh, setSavingRrhh] = useState(false);
  // Ahorro calculado — escala impositiva marginal del empleado
  // En Argentina Ganancias 4ta categoría: 27% es la tasa marginal más común para trabajadores en relación de dependencia
  const TAX_RATE = 0.27;
  const totalApproved = mockTickets.filter(t => t.status === "approved" || t.status === "loaded").reduce((a, b) => a + b.amount, 0);
  const totalRejected = mockTickets.filter(t => t.status === "rejected").reduce((a, b) => a + b.amount, 0);
  const totalPending  = mockTickets.filter(t => t.status === "pending").reduce((a, b) => a + b.amount, 0);
  const monthlySaving = Math.round(totalApproved * TAX_RATE);

  const handleGoogleLogin = () => {
    setLoginLoading(true); setLoginMethod("google");
    setTimeout(() => { setLoginLoading(false); setScreen("connect-arca"); }, 1600);
  };
  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (!loginEmail) return;
    setLoginLoading(true); setLoginMethod("email");
    setTimeout(() => { setLoginLoading(false); setEmailSent(true); }, 1200);
  };
  const handleArcaConnect = () => {
    if (!cuit || !claveFiscal) return;
    setArcaConnecting(true);
    setTimeout(() => { setArcaConnecting(false); setArcaConnected(true); }, 2200);
  };
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
      setRectifying(false);
      setShowRectModal(false);
      // Reiniciar flujo de carga con contexto de rectificativa
      setIsRectificativa(true);
      setRectVersion(v => v + 1);
      setUploaded(false);
      setAnalyzed(false);
      setAnalyzing(false);
      setPresenting(false);
      setPresentProgress(0);
      setArcaStatus("pending");
      setStep(1); // Volver a "Mis Tickets"
    }, 1800);
  };

  /* ─── Shared styles ─── */
  const cardStyle = {
    background: "#fff",
    border: "1.5px solid #f1f0ff",
    borderRadius: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 24px rgba(124,58,237,0.04)",
    padding: "20px 24px",
  };

  /* ════════════════════════════════════════
     SCREEN: LOGIN
  ════════════════════════════════════════ */
  if (screen === "login") return (
    <>
      <FontLoader />
      <style>{`
        .login-bg {
          min-height: 100vh;
          background: linear-gradient(145deg, #0d0b1f 0%, #1a1040 40%, #2d1b69 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          position: relative;
          overflow: hidden;
        }
        .login-bg::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%);
          top: -200px; right: -200px;
          pointer-events: none;
        }
        .login-bg::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
        }
        .login-card {
          background: rgba(255,255,255,0.97);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          padding: 32px 28px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.1);
        }
        .login-google-btn {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          padding: 11px 16px;
          background: #fff;
          color: #374151;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 16px;
        }
        .login-google-btn:hover { background: #f9fafb; border-color: #d1d5db; }
      `}</style>
      <div className="login-bg">
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

          {/* Logo + tagline */}
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


          {/* Card */}
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
                <input className="input-field" type="email" placeholder="nombre@empresa.com"
                  value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                <button type="submit" disabled={loginLoading || !loginEmail} className="gradient-btn" style={{
                  width: "100%", color: "#fff", fontWeight: 700, fontSize: 14,
                  border: "none", borderRadius: 10, padding: "12px 16px",
                  cursor: loginLoading || !loginEmail ? "not-allowed" : "pointer",
                  opacity: loginLoading || !loginEmail ? 0.55 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {loginLoading && loginMethod === "email" && <Spinner size={15} color="#fff"/>}
                  Recibir link de acceso
                </button>
              </form>

              <p style={{ fontSize: 11, color: "#d1d5db", textAlign: "center", marginTop: 18, lineHeight: 1.7 }}>
                Sin contraseñas. Un link directo a tu mail. 🪄
              </p>
            </>) : (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>📬</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Revisá tu mail</h3>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Mandamos un link a</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", marginBottom: 18 }}>{loginEmail}</p>
                <p style={{ fontSize: 12, color: "#d1d5db", marginBottom: 18, lineHeight: 1.6 }}>Hacé clic para entrar. Sin contraseña.</p>
                <button onClick={() => setScreen("connect-arca")} style={{ fontSize: 12, color: "#c4b5fd", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  (demo: simular ingreso →)
                </button>
              </div>
            )}
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 20, lineHeight: 1.7 }}>
            Al ingresar aceptás los{" "}
            <span style={{ color: "rgba(167,139,250,0.7)", cursor: "pointer" }}>Términos de uso</span>
            {" "}y la{" "}
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

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 28 }}>
            <LogoBrand size={34} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
              DEDU<span style={{ color: "#7c3aed" }}>XÍ</span>
            </span>
          </div>

          <div style={{ ...cardStyle, padding: "28px 24px" }}>
            {!arcaConnected ? (<>

              {/* Header */}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
                }}>🔗</div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Conectá tu cuenta ARCA</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>Solo esta vez. Después es automático.</p>
                </div>
              </div>

              {/* Security note */}
              <div style={{
                background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 10,
                padding: "10px 12px", display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 20,
              }}>
                <span style={{ color: "#7c3aed", marginTop: 1, flexShrink: 0 }}><ShieldIcon /></span>
                <p style={{ fontSize: 12, color: "#6d28d9", lineHeight: 1.6 }}>
                  Tu clave fiscal <strong>nunca se guarda en texto plano</strong>. Se cifra con AES-256 y solo se usa para ingresar a ARCA en tu nombre.
                </p>
              </div>

              {/* Form */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>CUIT</label>
                  <input className="input-field" type="text" placeholder="20-12345678-9" value={cuit} onChange={e => setCuit(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Clave Fiscal ARCA</label>
                  <div style={{ position: "relative" }}>
                    <input className="input-field" type={showClave ? "text" : "password"} placeholder="Tu clave fiscal" value={claveFiscal} onChange={e => setClaveFiscal(e.target.value)} style={{ paddingRight: 54 }} />
                    <button onClick={() => setShowClave(!showClave)} style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", fontSize: 11, fontWeight: 600,
                      color: "#9ca3af", cursor: "pointer"
                    }}>{showClave ? "Ocultar" : "Ver"}</button>
                  </div>
                </div>
              </div>

              <button onClick={handleArcaConnect} disabled={arcaConnecting || !cuit || !claveFiscal} className="gradient-btn" style={{
                width: "100%", color: "#fff", fontWeight: 700, fontSize: 14,
                border: "none", borderRadius: 10, padding: "12px 16px",
                cursor: arcaConnecting || !cuit || !claveFiscal ? "not-allowed" : "pointer",
                opacity: !cuit || !claveFiscal ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}>
                {arcaConnecting ? <><Spinner size={15} color="#fff"/> Verificando…</> : "Conectar y continuar →"}
              </button>

              <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 14 }}>
                ¿No tenés clave fiscal?{" "}
                <span style={{ color: "#7c3aed", cursor: "pointer" }}>Cómo obtenerla</span>
              </p>
            </>) : (
              /* connected */
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, margin: "0 auto 16px",
                }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 6 }}>¡ARCA conectado!</h3>
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24 }}>Tu cuenta está lista. A partir de ahora todo es automático.</p>
                <button onClick={() => setScreen("app")} className="gradient-btn" style={{
                  width: "100%", color: "#fff", fontWeight: 700, fontSize: 14,
                  border: "none", borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                }}>
                  Empezar →
                </button>
              </div>
            )}
          </div>

          {!arcaConnected && (
            <p style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={() => setScreen("app")} style={{ fontSize: 12, color: "#d1d5db", background: "none", border: "none", cursor: "pointer" }}>
                (demo: saltar →)
              </button>
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
          background: "#fff",
          borderBottom: "1.5px solid #f1f0ff",
          padding: "0 24px",
          height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 40,
          boxShadow: "0 1px 12px rgba(124,58,237,0.06)",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoBrand size={32} />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
              DEDU<span style={{ color: "#7c3aed" }}>XÍ</span>
            </span>
          </div>

          {/* Step nav */}
          <div style={{ display: "flex", gap: 4 }}>
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: step === i ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
                color: step === i ? "#fff" : "#9ca3af",
                boxShadow: step === i ? "0 2px 12px rgba(124,58,237,0.25)" : "none",
              }}>{s}</button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#f0fdf4", border: "1.5px solid #bbf7d0",
              borderRadius: 99, padding: "4px 10px",
            }}>
              <span className="status-dot" style={{ background: "#22c55e" }}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>ARCA conectado</span>
            </div>
            <button onClick={() => { setShowProfilePanel(true); setEditingClave(false); setClaveSaved(false); }} style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13,
              boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              transition: "box-shadow 0.15s",
            }}>MP</button>
          </div>
        </nav>


        {/* ── CONTENT ── */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>

          {/* Banner rectificativa */}
          {isRectificativa && step > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "linear-gradient(135deg, #faf5ff, #ede9fe)",
              border: "1.5px solid #ddd6fe", borderRadius: 12,
              padding: "12px 16px", marginBottom: 20,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
              }}>🔄</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>
                  Corrección Marzo 2026 · Rectificativa {rectVersion}
                </p>
                <p style={{ fontSize: 11, color: "#7c3aed", marginTop: 1 }}>
                  Revisá los tickets, actualizá lo que cambió y volvé a presentar en ARCA.
                </p>
              </div>
              <button onClick={() => { setIsRectificativa(false); setStep(3); setArcaStatus("sent"); }} style={{
                fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", flexShrink: 0,
              }}>Cancelar</button>
            </div>
          )}

          {/* ── STEP 0: INICIO ── */}
          {step === 0 && (
            <div>
              {/* Hero */}
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#faf5ff", border: "1.5px solid #ede9fe",
                  borderRadius: 99, padding: "5px 14px", marginBottom: 16,
                }}>
                  <span style={{ fontSize: 13 }}>✨</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>Tu asistente de deducciones · Ganancias 2026</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", letterSpacing: "-1px", marginBottom: 10 }}>
                  Deducí más.<br/>Pagá menos.
                </h1>
                <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
                  Subí tus tickets, analizamos cuáles aplican y los cargamos en SIRADIG por vos.
                </p>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "Período", value: "Marzo 2026", icon: "📅", accent: "#7c3aed" },
                  { label: "Tickets cargados", value: "7", icon: "🧾", accent: "#7c3aed" },
                  { label: "Deducción", value: fmt(totalApproved), icon: "✅", accent: "#059669" },
                  { label: "A confirmar", value: fmt(totalPending), icon: "⏳", accent: "#d97706" },
                ].map((s, i) => (
                  <div key={i} style={{ ...cardStyle, padding: "16px 18px" }}>
                    <span style={{ fontSize: 22 }}>{s.icon}</span>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 8 }}>{s.label}</p>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginTop: 2 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Progreso del mes</span>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>4 de 7 resueltos</span>
                </div>
                <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden", display: "flex", gap: 2 }}>
                  <div style={{ background: "#10b981", width: "42%", borderRadius: 99 }}/>
                  <div style={{ background: "#ef4444", width: "14%", borderRadius: 99 }}/>
                  <div style={{ background: "#f59e0b", width: "44%", borderRadius: 99 }}/>
                </div>
                <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
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

              <button onClick={() => setStep(1)} className="gradient-btn" style={{
                width: "100%", color: "#fff", fontWeight: 700, fontSize: 15,
                border: "none", borderRadius: 12, padding: "14px", cursor: "pointer",
              }}>
                Subir tickets del mes →
              </button>
            </div>
          )}

          {/* ── STEP 1: UPLOAD / RECT MANAGER ── */}
          {step === 1 && (() => {
            // ── MODO RECTIFICATIVA: gestor de tickets ──
            if (isRectificativa) {
              const removedIds = Object.keys(ticketActions).filter(id => ticketActions[id] === "remove").map(Number);
              const editedIds  = Object.keys(ticketEdits).map(Number);
              const changeCount = removedIds.length + editedIds.filter(id => !removedIds.includes(id)).length + addedTickets.length;

              const actionBtn = (label, color, bg, border, onClick) => (
                <button onClick={onClick} style={{
                  fontSize: 11, fontWeight: 700, color, background: bg, border: `1.5px solid ${border}`,
                  borderRadius: 7, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap",
                }}>{label}</button>
              );

              return (
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
                    Revisá tus tickets
                  </h2>
                  <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>
                    Indicá qué cambió respecto a la presentación anterior.
                  </p>

                  {/* Leyenda de acciones */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    {[
                      { color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", label: "✓ Mantener" },
                      { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "✏️ Editar monto/fecha" },
                      { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "🗑 Eliminar" },
                    ].map((l, i) => (
                      <span key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:l.color, background:l.bg, border:`1px solid ${l.border}`, borderRadius:99, padding:"3px 10px" }}>
                        {l.label}
                      </span>
                    ))}
                  </div>

                  {/* Lista tickets existentes */}
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 12 }}>
                    {mockTickets.map((t, i) => {
                      const action = ticketActions[t.id] || "keep";
                      const isRemoved = action === "remove";
                      const edit = ticketEdits[t.id] || {};
                      const isEditing = editingTicketId === t.id;
                      const cfg = statusConfig[t.status];
                      return (
                        <div key={t.id} style={{
                          borderBottom: i < mockTickets.length - 1 ? "1px solid #f5f3ff" : "none",
                          opacity: isRemoved ? 0.4 : 1, transition: "opacity 0.2s",
                          background: isRemoved ? "#fef2f2" : isEditing ? "#faf5ff" : i % 2 === 0 ? "#fff" : "#faf9ff",
                        }}>
                          {/* Fila principal */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px" }}>
                            <span className="status-dot" style={{ background: cfg.dot, flexShrink: 0 }}/>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isRemoved ? "line-through" : "none" }}>
                                {t.provider}
                              </p>
                              <p style={{ fontSize: 11, color: "#9ca3af" }}>
                                {edit.date || t.date} · {edit.amount ? fmt(Number(edit.amount)) : fmt(t.amount)}
                              </p>
                            </div>
                            {/* Botones de acción */}
                            {!isRemoved && !isEditing && (
                              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                {actionBtn("✏️ Editar", "#d97706", "#fffbeb", "#fde68a", () => {
                                  setEditingTicketId(t.id);
                                  setTicketEdits(e => ({ ...e, [t.id]: { amount: t.amount, date: t.date, ...e[t.id] } }));
                                })}
                                {actionBtn("🗑 Eliminar", "#dc2626", "#fef2f2", "#fecaca", () => {
                                  setTicketActions(a => ({ ...a, [t.id]: "remove" }));
                                  setEditingTicketId(null);
                                })}
                              </div>
                            )}
                            {isRemoved && actionBtn("↩ Restaurar", "#6b7280", "#f9fafb", "#e5e7eb", () =>
                              setTicketActions(a => { const n = { ...a }; delete n[t.id]; return n; })
                            )}
                          </div>
                          {/* Panel de edición inline */}
                          {isEditing && (
                            <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                              <div style={{ display: "flex", gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Fecha</label>
                                  <input className="input-field" type="text" placeholder="DD/MM/AAAA"
                                    value={ticketEdits[t.id]?.date || ""}
                                    onChange={e => setTicketEdits(ed => ({ ...ed, [t.id]: { ...ed[t.id], date: e.target.value } }))}
                                    style={{ padding: "8px 10px", fontSize: 12 }}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Monto ($)</label>
                                  <input className="input-field" type="number"
                                    value={ticketEdits[t.id]?.amount || ""}
                                    onChange={e => setTicketEdits(ed => ({ ...ed, [t.id]: { ...ed[t.id], amount: e.target.value } }))}
                                    style={{ padding: "8px 10px", fontSize: 12 }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setEditingTicketId(null)} style={{
                                  flex: 1, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8,
                                  padding: "8px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer",
                                }}>Cancelar</button>
                                <button onClick={() => setEditingTicketId(null)} className="gradient-btn" style={{
                                  flex: 1, color: "#fff", fontWeight: 700, fontSize: 12, border: "none",
                                  borderRadius: 8, padding: "8px", cursor: "pointer",
                                }}>Guardar cambio</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tickets agregados */}
                  {addedTickets.length > 0 && (
                    <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{ padding: "10px 16px", borderBottom: "1.5px solid #f5f3ff", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>➕ Tickets nuevos agregados</span>
                        <span style={{ fontSize: 10, background: "#faf5ff", border: "1px solid #ddd6fe", color: "#7c3aed", borderRadius: 99, padding: "1px 8px", fontWeight: 700 }}>{addedTickets.length}</span>
                      </div>
                      {addedTickets.map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: i < addedTickets.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                          <span style={{ fontSize: 16 }}>🧾</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{t.provider || "Nuevo ticket"}</p>
                            <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} · {t.type}</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>{t.amount ? fmt(Number(t.amount)) : "—"}</span>
                          <button onClick={() => setAddedTickets(a => a.filter((_, j) => j !== i))} style={{
                            fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca",
                            borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700,
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario agregar ticket */}
                  {showAddTicket && (
                    <div style={{ ...cardStyle, marginBottom: 12, background: "#faf5ff", border: "1.5px solid #ddd6fe" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6", marginBottom: 14 }}>➕ Agregar ticket nuevo</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Proveedor</label>
                            <input className="input-field" placeholder="Nombre o razón social"
                              value={newTicketForm.provider}
                              onChange={e => setNewTicketForm(f => ({ ...f, provider: e.target.value }))}
                              style={{ padding: "8px 10px", fontSize: 12 }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Fecha</label>
                            <input className="input-field" placeholder="DD/MM/AAAA"
                              value={newTicketForm.date}
                              onChange={e => setNewTicketForm(f => ({ ...f, date: e.target.value }))}
                              style={{ padding: "8px 10px", fontSize: 12 }}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Tipo</label>
                            <select className="input-field"
                              value={newTicketForm.type}
                              onChange={e => setNewTicketForm(f => ({ ...f, type: e.target.value }))}
                              style={{ padding: "8px 10px", fontSize: 12 }}
                            >
                              {["Factura A", "Factura B", "Factura C", "Ticket"].map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>N° comprobante</label>
                            <input className="input-field" placeholder="0001-00001234"
                              value={newTicketForm.number}
                              onChange={e => setNewTicketForm(f => ({ ...f, number: e.target.value }))}
                              style={{ padding: "8px 10px", fontSize: 12 }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Monto ($)</label>
                            <input className="input-field" type="number" placeholder="0.00"
                              value={newTicketForm.amount}
                              onChange={e => setNewTicketForm(f => ({ ...f, amount: e.target.value }))}
                              style={{ padding: "8px 10px", fontSize: 12 }}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => { setShowAddTicket(false); setNewTicketForm({ provider: "", date: "", amount: "", number: "", type: "Factura B" }); }} style={{
                            flex: 1, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8,
                            padding: "9px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer",
                          }}>Cancelar</button>
                          <button onClick={() => {
                            if (!newTicketForm.provider && !newTicketForm.amount) return;
                            setAddedTickets(a => [...a, { ...newTicketForm }]);
                            setShowAddTicket(false);
                            setNewTicketForm({ provider: "", date: "", amount: "", number: "", type: "Factura B" });
                          }} className="gradient-btn" style={{
                            flex: 2, color: "#fff", fontWeight: 700, fontSize: 12, border: "none",
                            borderRadius: 8, padding: "9px", cursor: "pointer",
                          }}>Agregar ticket</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botón agregar */}
                  {!showAddTicket && (
                    <button onClick={() => setShowAddTicket(true)} style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: "#fff", border: "1.5px dashed #ddd6fe", borderRadius: 10,
                      padding: "11px", fontSize: 13, fontWeight: 600, color: "#7c3aed",
                      cursor: "pointer", marginBottom: 16,
                    }}>
                      ➕ Agregar ticket nuevo
                    </button>
                  )}

                  {/* Resumen cambios */}
                  {changeCount > 0 && (
                    <div style={{ background: "#faf5ff", border: "1.5px solid #ddd6fe", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: "#5b21b6", fontWeight: 700 }}>Cambios en esta corrección:</span>
                      {removedIds.length > 0 && <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>🗑 {removedIds.length} eliminado{removedIds.length > 1 ? "s" : ""}</span>}
                      {editedIds.filter(id => !removedIds.includes(id)).length > 0 && <span style={{ fontSize: 11, color: "#d97706", fontWeight: 600 }}>✏️ {editedIds.filter(id => !removedIds.includes(id)).length} editado{editedIds.length > 1 ? "s" : ""}</span>}
                      {addedTickets.length > 0 && <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>➕ {addedTickets.length} nuevo{addedTickets.length > 1 ? "s" : ""}</span>}
                    </div>
                  )}

                  <button onClick={() => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setAnalyzed(true); setStep(2); }, 2200); }} className="gradient-btn" style={{
                    width: "100%", color: "#fff", fontWeight: 700, fontSize: 15,
                    border: "none", borderRadius: 12, padding: "14px", cursor: "pointer",
                  }}>
                    🤖 Analizar cambios con IA →
                  </button>

                  {analyzing && (
                    <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "20px", textAlign: "center", marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: "bounce 0.8s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}/>)}
                        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }`}</style>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Re-analizando con los cambios aplicados…</p>
                    </div>
                  )}
                </div>
              );
            }

            // ── MODO NORMAL: upload ──
            return (
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>Subí tus tickets</h2>
                <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Fotos, PDF o imágenes. Los analizamos automáticamente.</p>

                {!uploaded ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); setUploaded(true); }}
                    onClick={() => setUploaded(true)}
                    style={{
                      border: `2px dashed ${dragging ? "#7c3aed" : "#e5e3ff"}`,
                      borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: "pointer",
                      background: dragging ? "#faf5ff" : "#fff",
                      transition: "all 0.2s", marginBottom: 20,
                    }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>📸</div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 }}>Arrastrá tus tickets acá</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>o hacé clic para seleccionarlos</p>
                    <span className="gradient-btn" style={{ display: "inline-block", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 8 }}>Seleccionar archivos</span>
                    <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 14 }}>JPG · PNG · PDF</p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 99, padding: "3px 10px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed" }}>Plan Básico</span>
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>· hasta 20 tickets/mes</span>
                      <span style={{ fontSize: 10, color: "#a78bfa", cursor: "pointer", fontWeight: 600 }}>· Mejorar →</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 20 }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1.5px solid #f5f3ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>7 archivos listos para analizar</span>
                      <span className="chip" style={{ background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>✓ Subidos</span>
                    </div>
                    {mockTickets.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: i % 2 === 0 ? "#fff" : "#faf9ff", borderBottom: i < mockTickets.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                        <span style={{ fontSize: 18 }}>🧾</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} · {t.type} {t.number}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>{fmt(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {uploaded && !analyzing && !analyzed && (
                  <button onClick={() => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setAnalyzed(true); setStep(2); }, 2200); }} className="gradient-btn" style={{
                    width: "100%", color: "#fff", fontWeight: 700, fontSize: 15,
                    border: "none", borderRadius: 12, padding: "14px", cursor: "pointer",
                  }}>
                    🤖 Analizar con IA →
                  </button>
                )}

                {analyzing && (
                  <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: "bounce 0.8s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}/>)}
                      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }`}</style>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Analizando con IA… procesando {mockTickets.length} tickets</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── STEP 2: ANÁLISIS ── */}
          {step === 2 && (() => {
            const statusOrder = { approved: 0, loaded: 1, pending: 2, rejected: 3 };
            const sorted = [...mockTickets].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

            const groups = [
              { key: "approved", label: "✅ Aplican como deducción", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", tickets: sorted.filter(t => t.status === "approved" || t.status === "loaded") },
              { key: "pending",  label: "⏳ A confirmar",            color: "#d97706", bg: "#fffbeb", border: "#fde68a", tickets: sorted.filter(t => t.status === "pending") },
              { key: "rejected", label: "❌ No aplican",             color: "#dc2626", bg: "#fef2f2", border: "#fecaca", tickets: sorted.filter(t => t.status === "rejected") },
            ];

            const wikiItems = [
              {
                icon: "🖥️", title: "Equipamiento de trabajo",
                color: "#059669", bg: "#ecfdf5", border: "#a7f3d0",
                body: "Computadoras, monitores, teclados, auriculares, sillas ergonómicas, escritorios y cualquier elemento que uses para trabajar. Aplica tanto para trabajo en oficina como home office.",
              },
              {
                icon: "📱", title: "Tecnología y software",
                color: "#059669", bg: "#ecfdf5", border: "#a7f3d0",
                body: "Celulares de uso laboral, tablets, suscripciones a software profesional (Adobe, Office, etc.), hosting, dominios. Debe poder justificarse como herramienta de trabajo.",
              },
              {
                icon: "🛒", title: "Supermercados y alimentos",
                color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
                body: "Aunque trabajes desde casa, la comida no es deducible como equipamiento. La normativa SIRADIG limita la deducción a indumentaria y equipamiento, no a gastos de vida.",
              },
              {
                icon: "🚗", title: "Peajes, combustible y transporte",
                color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
                body: "Los peajes y gastos de movilidad no entran en la categoría de equipamiento o indumentaria. Podrían deducirse por otra vía (viáticos) si el empleador los incluye, pero no por esta.",
              },
              {
                icon: "👤", title: "Personas físicas",
                color: "#d97706", bg: "#fffbeb", border: "#fde68a",
                body: "Cuando el proveedor es una persona física (no una empresa), hay que confirmar el rubro. Si es un profesional de tecnología, diseño, etc., puede aplicar. Si es un particular sin relación con tu trabajo, no.",
              },
              {
                icon: "🛍️", title: "Marketplaces (MercadoLibre, etc.)",
                color: "#d97706", bg: "#fffbeb", border: "#fde68a",
                body: "El marketplace en sí puede vender cualquier cosa. Lo que importa es qué compraste. Si fue equipamiento de trabajo (notebook, silla, etc.), aplica. Si fue ropa casual o alimentos, no.",
              },
            ];

            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 2 }}>Análisis de deducciones</h2>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>IA evaluó cada ticket según normativa SIRADIG 2026</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deducción total</p>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "#059669", letterSpacing: "-1px" }}>{fmt(totalApproved)}</p>
                  </div>
                </div>

                {/* Tickets agrupados por color */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
                  {groups.filter(g => g.tickets.length > 0).map(group => (
                    <div key={group.key}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: group.color }}>{group.label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: group.color, background: group.bg, border: `1px solid ${group.border}`, borderRadius: 99, padding: "1px 8px" }}>
                          {group.tickets.length} ticket{group.tickets.length > 1 ? "s" : ""}
                        </span>
                        <div style={{ flex: 1, height: 1, background: group.border }}/>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {group.tickets.map(t => {
                          const cfg = statusConfig[t.status];
                          return (
                            <div key={t.id} style={{
                              background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                              borderRadius: 12, padding: "13px 16px", display: "flex", gap: 12, alignItems: "flex-start",
                            }}>
                              <span className="status-dot" style={{ background: cfg.dot, marginTop: 5, flexShrink: 0 }}/>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{t.date} · {t.type} · N° {t.number}</p>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0 }}>{fmt(t.amount)}</span>
                                </div>
                                <p style={{ fontSize: 12, color: cfg.text, marginTop: 7 }}>💬 {t.reason}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen */}
                <div style={{ ...cardStyle, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Resumen para SIRADIG</p>
                  {[
                    { label: "✅ Aplican (cargar)", value: fmt(totalApproved), color: "#059669" },
                    { label: "❌ No aplican (ignorar)", value: fmt(totalRejected), color: "#dc2626" },
                    { label: "❓ Pendiente confirmar", value: fmt(totalPending), color: "#d97706" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid #f5f3ff" : "none" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{r.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* WIKI */}
                <details style={{ marginBottom: 20 }}>
                  <summary style={{
                    cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8,
                    background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12,
                    padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6d28d9",
                    userSelect: "none",
                  }}>
                    <span style={{ fontSize: 16 }}>📖</span>
                    ¿Por qué aplica o no cada gasto?
                    <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 500, color: "#a78bfa" }}>Ver criterios →</span>
                  </summary>
                  <div style={{
                    border: "1.5px solid #ede9fe", borderTop: "none",
                    borderRadius: "0 0 12px 12px", overflow: "hidden",
                  }}>
                    {wikiItems.map((w, i) => (
                      <div key={i} style={{
                        padding: "14px 16px",
                        borderBottom: i < wikiItems.length - 1 ? "1px solid #f5f3ff" : "none",
                        background: i % 2 === 0 ? "#fff" : "#fdfcff",
                        display: "flex", gap: 12, alignItems: "flex-start",
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: w.bg, border: `1.5px solid ${w.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                        }}>{w.icon}</div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: w.color, marginBottom: 3 }}>{w.title}</p>
                          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{w.body}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: "12px 16px", background: "#faf5ff", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14 }}>⚖️</span>
                      <p style={{ fontSize: 11, color: "#7c3aed", lineHeight: 1.6, fontStyle: "italic" }}>
                        Basado en el Art. 82 inc. h) de la Ley de Impuesto a las Ganancias y la RG AFIP 4003/2017. Los criterios pueden variar según el caso. Ante dudas, consultá con tu contador.
                      </p>
                    </div>
                  </div>
                </details>

                <button onClick={() => setStep(3)} className="gradient-btn" style={{
                  width: "100%", color: "#fff", fontWeight: 700, fontSize: 15,
                  border: "none", borderRadius: 12, padding: "14px", cursor: "pointer",
                }}>
                  Presentar en ARCA →
                </button>
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
                {/* Timeline */}
                <div style={{ ...cardStyle, marginBottom: 20, padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 20 }}>
                    {statuses.map((s, i) => {
                      const isActive = s.key === arcaStatus;
                      const isPast = i < curIdx;
                      return (
                        <div key={s.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
                          {i < statuses.length - 1 && (
                            <div style={{
                              position: "absolute", top: 16, left: "50%", width: "100%", height: 2,
                              background: isPast || isActive ? "linear-gradient(90deg, #c4b5fd, #a5b4fc)" : "#f3f4f6",
                              zIndex: 0,
                            }}/>
                          )}
                          <div style={{
                            width: 34, height: 34, borderRadius: "50%", zIndex: 1,
                            background: isActive ? `linear-gradient(135deg, ${s.accent}22, ${s.accent}33)` : isPast ? "#f3f4f6" : "#f9fafb",
                            border: `2px solid ${isActive ? s.accent : isPast ? "#e5e7eb" : "#f3f4f6"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, transition: "all 0.2s",
                            boxShadow: isActive ? `0 0 0 4px ${s.accent}18` : "none",
                            transform: isActive ? "scale(1.1)" : "scale(1)",
                          }}>{s.icon}</div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? s.txt : "#9ca3af", textAlign: "center", lineHeight: 1.3 }}>{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: cur.bg, border: `1.5px solid ${cur.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, color: cur.txt }}>
                    {cur.desc}
                  </div>
                </div>

                {/* Resumen */}
                <div style={{ ...cardStyle, marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Marzo 2026</p>
                  {[
                    { label: "Tickets deducidos", value: "4" },
                    { label: "Total deducción", value: fmt(totalApproved), bold: true, color: "#059669", size: 18 },
                    isRectificativa && { label: "Versión", value: null, chip: `Rectificativa ${rectVersion}`, chipBg: "#faf5ff", chipColor: "#7c3aed", chipBorder: "#ddd6fe" },
                    { label: "Estado", value: null, chip: arcaStatus === "pending" ? "No iniciado" : arcaStatus === "draft" ? "Borrador · No enviado" : arcaStatus === "sent" ? "Enviado al empleador" : "Corrección enviada", chipBg: cur.bg, chipColor: cur.txt, chipBorder: cur.border },
                  ].filter(Boolean).map((r, i, arr) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                      <span style={{ fontSize: 13, color: "#374151" }}>{r.label}</span>
                      {r.chip ? (
                        <span className="chip" style={{ background: r.chipBg || "#f3f4f6", color: r.chipColor || "#6b7280", border: `1px solid ${r.chipBorder || "#e5e7eb"}` }}>{r.chip}</span>
                      ) : (
                        <span style={{ fontSize: r.size || 14, fontWeight: r.bold ? 800 : 600, color: r.color || "#111827" }}>{r.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Spinners */}
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

                {/* Acciones */}
                {!presenting && !rectifying && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {arcaStatus === "pending" && (
                      <button onClick={handlePresent} className="gradient-btn" style={{
                        width: "100%", color: "#fff", fontWeight: 700, fontSize: 15,
                        border: "none", borderRadius: 12, padding: "15px", cursor: "pointer",
                      }}>
                        {isRectificativa ? `Presentar Rectificativa ${rectVersion} →` : "Cargar en ARCA"}
                      </button>
                    )}
                    {arcaStatus === "draft" && (<>
                      <button onClick={() => { setArcaStatus("sent"); setIsRectificativa(false); }} className="gradient-btn" style={{
                        width: "100%", color: "#fff", fontWeight: 700, fontSize: 15,
                        border: "none", borderRadius: 12, padding: "15px", cursor: "pointer",
                      }}>
                        {isRectificativa ? `Enviar Rectificativa ${rectVersion} al empleador →` : "Enviar al empleador →"}
                      </button>
                      <button onClick={() => setShowRectModal(true)} style={{
                        width: "100%", background: "#fff", color: "#6b7280", fontWeight: 600, fontSize: 13,
                        border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "11px", cursor: "pointer",
                        transition: "all 0.15s",
                      }}>¿Necesitás corregir algo?</button>
                    </>)}
                    {arcaStatus === "sent" && (<>

                      {/* ── Confirmación ── */}
                      <div style={{
                        background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                        border: "1.5px solid #a7f3d0", borderRadius: 14,
                        padding: "18px 20px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#065f46", marginBottom: 2 }}>
                          ¡Presentación enviada!
                        </p>
                        <p style={{ fontSize: 13, color: "#059669" }}>
                          Tu empleador ya recibió las deducciones de Marzo 2026.
                        </p>
                      </div>

                      {/* ── Ahorro calculado ── */}
                      <div style={{
                        background: "linear-gradient(135deg, #faf5ff, #ede9fe)",
                        border: "1.5px solid #ddd6fe", borderRadius: 14,
                        padding: "16px 20px",
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                          💰 Tu ahorro estimado este mes
                        </p>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 34, fontWeight: 800, color: "#5b21b6", letterSpacing: "-1.5px", lineHeight: 1 }}>
                            {fmt(monthlySaving)}
                          </span>
                          <span style={{ fontSize: 12, color: "#a78bfa", marginBottom: 4, fontWeight: 600 }}>menos de impuesto</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#7c3aed", background: "rgba(124,58,237,0.06)", borderRadius: 8, padding: "8px 10px" }}>
                          <span>Base deducida: <strong>{fmt(totalApproved)}</strong></span>
                          <span>Tasa marginal: <strong>27%</strong></span>
                        </div>
                        <p style={{ fontSize: 10, color: "#c4b5fd", marginTop: 8, lineHeight: 1.5 }}>
                          Estimación basada en escala del Impuesto a las Ganancias 4ta categoría. El ahorro real puede variar según tu sueldo bruto y otras deducciones.
                        </p>
                      </div>

                      {/* ── PDF comprobante ── */}
                      <button onClick={() => alert("📄 Generando PDF... (en producción se descarga el comprobante SIRADIG)")} style={{
                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10,
                        padding: "11px", fontSize: 13, fontWeight: 600, color: "#374151",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                        <span style={{ fontSize: 16 }}>📄</span>
                        Descargar comprobante PDF
                      </button>

                      {/* ── Delegación RRHH ── */}
                      <div style={{
                        background: "#fff", border: "1.5px solid #f1f0ff",
                        borderRadius: 14, padding: "16px 18px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                      }}>
                        {!rrhhSaved ? (<>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                            ¿Querés que lo hagamos nosotros cada mes?
                          </p>
                          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14, lineHeight: 1.6 }}>
                            Dejanos el email de tu área de RRHH y nos encargamos de enviar la declaración todos los meses — vos solo revisás y confirmás.
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              className="input-field"
                              type="email"
                              placeholder="rrhh@empresa.com"
                              value={rrhhEmail}
                              onChange={e => setRrhhEmail(e.target.value)}
                              style={{ flex: 1, padding: "9px 12px", fontSize: 13 }}
                            />
                            <button
                              onClick={() => {
                                if (!rrhhEmail) return;
                                setSavingRrhh(true);
                                setTimeout(() => { setSavingRrhh(false); setRrhhSaved(true); }, 1400);
                              }}
                              disabled={savingRrhh || !rrhhEmail}
                              className="gradient-btn"
                              style={{
                                color: "#fff", fontWeight: 700, fontSize: 13,
                                border: "none", borderRadius: 10, padding: "9px 16px",
                                cursor: !rrhhEmail ? "not-allowed" : "pointer",
                                opacity: !rrhhEmail ? 0.5 : 1,
                                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                              }}>
                              {savingRrhh ? <><Spinner size={13} color="#fff"/> Guardando</> : "Guardar ✓"}
                            </button>
                          </div>
                        </>) : (
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                            }}>✉️</div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 1 }}>
                                ¡Listo! Nos encargamos el mes que viene.
                              </p>
                              <p style={{ fontSize: 11, color: "#9ca3af" }}>
                                Enviaremos a <strong style={{ color: "#7c3aed" }}>{rrhhEmail}</strong> cada mes automáticamente.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Corrección ── */}
                      <button onClick={() => setShowRectModal(true)} style={{
                        width: "100%", background: "none", border: "none",
                        fontSize: 12, color: "#9ca3af", cursor: "pointer", padding: "4px",
                      }}>¿Necesitás corregir algo? →</button>

                    </>)}
                    {arcaStatus === "rectificativa" && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", color: "#7c3aed", fontSize: 14, fontWeight: 700 }}>
                        ✅ Corrección presentada exitosamente
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => { setArcaStatus("pending"); setPresenting(false); setPresentProgress(0); }} style={{
                  width: "100%", background: "none", border: "none", fontSize: 11, color: "#d1d5db",
                  marginTop: 24, cursor: "pointer",
                }}>↺ Reiniciar demo</button>

                {/* Modal rectificativa */}
                {showRectModal && (
                  <div style={{
                    position: "fixed", inset: 0, background: "rgba(15,12,41,0.55)",
                    display: "flex", alignItems: "flex-end", justifyContent: "center",
                    zIndex: 50, padding: 16,
                  }} onClick={() => setShowRectModal(false)}>
                    <div style={{
                      background: "#fff", borderRadius: 24, padding: "28px 24px",
                      width: "100%", maxWidth: 360,
                      boxShadow: "0 -8px 60px rgba(15,12,41,0.2)",
                    }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Presentar corrección</h3>
                      <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.6 }}>
                        Podés corregir o agregar deducciones en cualquier momento del año fiscal. Actualizamos todo en ARCA por vos.
                      </p>
                      <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "#6d28d9", marginBottom: 20, lineHeight: 1.6 }}>
                        💡 La rectificativa reemplaza lo anterior. Tu empleador recibirá la versión actualizada.
                      </div>
                      <button onClick={handleRectificar} className="gradient-btn" style={{
                        width: "100%", color: "#fff", fontWeight: 700, fontSize: 14,
                        border: "none", borderRadius: 10, padding: "12px", cursor: "pointer", marginBottom: 10,
                      }}>Sí, corregir este mes</button>
                      <button onClick={() => setShowRectModal(false)} style={{
                        width: "100%", background: "none", border: "none", fontSize: 13,
                        color: "#9ca3af", cursor: "pointer", padding: "8px",
                      }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

        {/* ── PROFILE PANEL ── */}
        {showProfilePanel && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,12,41,0.4)", zIndex: 50,
            display: "flex", justifyContent: "flex-end", alignItems: "flex-start",
            padding: "68px 16px 16px",
          }} onClick={() => setShowProfilePanel(false)}>
            <div style={{
              background: "#fff", borderRadius: 18, padding: "20px",
              width: "100%", maxWidth: 280,
              boxShadow: "0 8px 48px rgba(15,12,41,0.15)",
              border: "1.5px solid #f1f0ff",
            }} onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, borderBottom: "1.5px solid #f5f3ff", marginBottom: 16 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 13,
                }}>MP</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Marisol Pérez</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>mfmarisoll@gmail.com</p>
                </div>
              </div>

              {/* ARCA */}
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Cuenta ARCA</p>
              <div style={{ background: "#f8f7ff", border: "1.5px solid #f1f0ff", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>CUIT</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", fontWeight: 600 }}>20-12345678-9</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Clave fiscal</span>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151" }}>••••••••</span>
                </div>
              </div>

              {claveSaved && (
                <div style={{ background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 8, padding: "8px 10px", fontSize: 12, fontWeight: 600, color: "#059669", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  ✅ Clave actualizada
                </div>
              )}

              {!editingClave ? (
                <button onClick={() => setEditingClave(true)} style={{
                  width: "100%", background: "#fff", border: "1.5px solid #e5e7eb",
                  borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 600,
                  color: "#374151", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>🔑 Actualizar clave fiscal</button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showNewClave ? "text" : "password"}
                      placeholder="Nueva clave fiscal"
                      value={newClaveFiscal}
                      onChange={e => setNewClaveFiscal(e.target.value)}
                      style={{ paddingRight: 48 }}
                      autoFocus
                    />
                    <button onClick={() => setShowNewClave(!showNewClave)} style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", fontSize: 10, fontWeight: 600, color: "#9ca3af", cursor: "pointer"
                    }}>{showNewClave ? "Ocultar" : "Ver"}</button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingClave(false); setNewClaveFiscal(""); }} style={{
                      flex: 1, background: "#fff", border: "1.5px solid #e5e7eb",
                      borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer",
                    }}>Cancelar</button>
                    <button onClick={handleUpdateClave} disabled={savingClave || !newClaveFiscal} className="gradient-btn" style={{
                      flex: 1, color: "#fff", fontWeight: 700, fontSize: 12, border: "none",
                      borderRadius: 8, padding: "8px", cursor: "pointer",
                      opacity: !newClaveFiscal ? 0.5 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    }}>
                      {savingClave ? <><Spinner size={12} color="#fff"/> Guardando</> : "Guardar"}
                    </button>
                  </div>
                </div>
              )}

              {/* Logout */}
              <div style={{ borderTop: "1.5px solid #f5f3ff", marginTop: 16, paddingTop: 14 }}>
                <button onClick={() => { setShowProfilePanel(false); setScreen("login"); }} style={{
                  width: "100%", background: "none", border: "none", fontSize: 13,
                  color: "#9ca3af", cursor: "pointer", fontWeight: 500,
                  transition: "color 0.15s",
                }}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom nav mobile */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#fff", borderTop: "1.5px solid #f1f0ff",
          display: "flex",
        }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, padding: "10px 4px", border: "none",
              background: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: step === i ? "#7c3aed" : "#9ca3af",
              fontSize: 11, fontWeight: 600, transition: "color 0.15s",
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
