import { useApp } from "../contexts/AppContext";
import { LogoBrand } from "../components/LogoBrand";

const loginCardStyle = {
  background: "rgba(255, 255, 255, 0.07)",
  backdropFilter: "blur(24px) saturate(1.3)",
  WebkitBackdropFilter: "blur(24px) saturate(1.3)",
  border: "1px solid rgba(139, 92, 246, 0.18)",
  borderRadius: 20,
  boxShadow: "0 24px 80px rgba(0,0,0,0.3), 0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export default function LoginScreen() {
  const {
    setScreen, setCuit, setClaveFiscal, setArcaPhase, setArcaError, setArcaErrMsg, isMobile,
  } = useApp();

  const goToArca = () => {
    setCuit(""); setClaveFiscal(""); setArcaPhase("cuit"); setArcaError(null); setArcaErrMsg("");
    setScreen("connect-arca");
  };

  return (
    <div className="login-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 24 }}>
      <div className="login-container" style={{ width: "100%", maxWidth: isMobile ? 380 : 460, textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: isMobile ? 28 : 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <LogoBrand size={isMobile ? 48 : 64} />
          <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, letterSpacing: "-1px", marginTop: isMobile ? 10 : 14 }}>
            <span className="ai-gradient-text">DEDUXI</span>
          </div>
        </div>

        {/* Card */}
        <div style={{ ...loginCardStyle, padding: isMobile ? "28px 22px" : "40px 36px", textAlign: "center" }}>
          <p style={{ fontSize: isMobile ? 19 : 24, fontWeight: 800, color: "#fff", marginBottom: isMobile ? 8 : 10, letterSpacing: "-0.3px" }}>
            Pagá menos Ganancias
          </p>
          <p style={{ fontSize: isMobile ? 13 : 15, color: "rgba(255,255,255,0.55)", marginBottom: isMobile ? 24 : 32, lineHeight: 1.7 }}>
            Importamos tus comprobantes, identificamos deducciones y armamos tu F.572 Web.
          </p>

          <button onClick={goToArca} className="gradient-btn" style={{
            width: "100%", color: "#fff", fontWeight: 700, fontSize: isMobile ? 15 : 16, border: "none", borderRadius: isMobile ? 12 : 14, padding: isMobile ? "13px 16px" : "16px 20px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: isMobile ? 14 : 20,
          }}>
            Conectar con ARCA →
          </button>

          <p style={{ fontSize: isMobile ? 11 : 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
            Necesitás tu CUIT y clave fiscal. Tu clave <strong>nunca se almacena</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
