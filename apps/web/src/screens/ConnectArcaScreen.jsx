import { useApp, cardStyle } from "../contexts/AppContext";
import { LogoBrand } from "../components/LogoBrand";
import { Spinner } from "../components/Spinner";
import { ShieldIcon } from "../components/Icons";

export default function ConnectArcaScreen() {
  const {
    setScreen, isMobile,
    cuit, setCuit, claveFiscal, setClaveFiscal, showClave, setShowClave,
    arcaConnecting, arcaConnected,
    arcaError, setArcaError, arcaPhase, setArcaPhase,
    captchaImage, captchaSolution, setCaptchaSolution,
    arcaErrMsg, setArcaErrMsg,
    handleArcaStart, handleArcaComplete, handleRefreshCaptcha,
  } = useApp();

  return (
    <div className="app-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 14 : 24 }}>
      <div className="login-container" style={{ width: "100%", maxWidth: isMobile ? 400 : 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: isMobile ? 22 : 28 }}>
          <LogoBrand size={isMobile ? 30 : 38} />
          <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, letterSpacing: "-0.5px" }}><span className="ai-gradient-text">DEDUXI</span></span>
        </div>
        <div style={{ ...cardStyle, padding: isMobile ? "24px 20px" : "36px 32px", overflow: "hidden" }}>
          {!arcaConnected ? (<>

            {/* Phase 1: CUIT — connecting spinner */}
            {arcaPhase === "cuit" && arcaConnecting && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #ede9fe", borderTopColor: "#7c3aed", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Abriendo sesión en ARCA…</p>
                <p style={{ fontSize: 11, color: "#9ca3af" }}>Esto tarda ~10 segundos la primera vez</p>
              </div>
            )}

            {/* Phase 1: CUIT — input form */}
            {arcaPhase === "cuit" && !arcaConnecting && (
              <div>
                <p style={{ fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "#111827", marginBottom: isMobile ? 14 : 18 }}>Conectá con ARCA</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: arcaError === "cuit" ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>CUIT</label>
                    <input className="input-field" type="text" placeholder="20-12345678-9" value={cuit}
                      onChange={e => { setCuit(e.target.value); setArcaError(null); setArcaErrMsg(""); }}
                      onKeyDown={e => e.key === "Enter" && handleArcaStart()}
                      autoFocus
                      style={{ borderColor: arcaError === "cuit" ? "#fca5a5" : undefined, background: arcaError === "cuit" ? "#fff5f5" : undefined }} />
                    {(arcaError === "cuit" || arcaErrMsg) && (
                      <p style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>
                        {arcaErrMsg || "El CUIT debe tener 11 dígitos."}
                      </p>
                    )}
                  </div>
                  <button onClick={handleArcaStart} disabled={!cuit} className="gradient-btn" style={{
                    width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "14px 18px",
                    cursor: !cuit ? "not-allowed" : "pointer", opacity: !cuit ? 0.5 : 1,
                  }}>
                    Continuar →
                  </button>
                  <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
                    Tu clave fiscal <strong>nunca se almacena</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Phase 2: CAPTCHA + clave */}
            {(arcaPhase === "captcha" || arcaPhase === "verifying") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* CUIT locked */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f7ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "10px 14px" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>CUIT</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{cuit}</p>
                  </div>
                  <button onClick={() => { setArcaPhase("cuit"); setArcaErrMsg(""); setArcaError(null); }} style={{ fontSize: 12, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Cambiar</button>
                </div>

                {/* CAPTCHA */}
                {captchaImage && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Captcha</label>
                      <button onClick={handleRefreshCaptcha} style={{ fontSize: 11, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>🔄 Otro</button>
                    </div>
                    <div style={{ background: "#f3f4f6", borderRadius: 8, padding: 8, marginBottom: 8, display: "flex", justifyContent: "center" }}>
                      <img src={captchaImage} alt="CAPTCHA" style={{ height: 50, imageRendering: "pixelated", borderRadius: 4 }} />
                    </div>
                    <input className="input-field" type="text" placeholder="Caracteres de la imagen" value={captchaSolution}
                      onChange={e => { setCaptchaSolution(e.target.value); setArcaErrMsg(""); }}
                      onKeyDown={e => e.key === "Enter" && handleArcaComplete()}
                      autoComplete="off" autoCorrect="off" spellCheck={false} style={{ letterSpacing: "0.1em" }} />
                  </div>
                )}

                {/* Clave fiscal */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: arcaError === "clave" ? "#dc2626" : "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Clave Fiscal</label>
                  <div style={{ position: "relative" }}>
                    <input className="input-field" type={showClave ? "text" : "password"} placeholder="Tu clave fiscal"
                      value={claveFiscal}
                      onChange={e => { setClaveFiscal(e.target.value); setArcaError(null); setArcaErrMsg(""); }}
                      onKeyDown={e => e.key === "Enter" && handleArcaComplete()}
                      style={{ paddingRight: 54, borderColor: arcaError === "clave" ? "#fca5a5" : undefined, background: arcaError === "clave" ? "#fff5f5" : undefined }} />
                    <button onClick={() => setShowClave(!showClave)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: 11, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>{showClave ? "Ocultar" : "Ver"}</button>
                  </div>
                </div>

                {/* Error */}
                {arcaErrMsg && (
                  <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>{arcaErrMsg}</p>
                    {arcaError === "clave" && (
                      <a href="https://www.arca.gob.ar/claveFiscal/" target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#7c3aed", marginTop: 6 }}>
                        Recuperar clave fiscal →
                      </a>
                    )}
                  </div>
                )}

                <button onClick={handleArcaComplete} disabled={arcaPhase === "verifying" || !claveFiscal || (captchaImage && !captchaSolution)} className="gradient-btn" style={{
                  width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "14px 18px",
                  cursor: arcaPhase === "verifying" || !claveFiscal || (captchaImage && !captchaSolution) ? "not-allowed" : "pointer",
                  opacity: !claveFiscal || (captchaImage && !captchaSolution) ? 0.5 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {arcaPhase === "verifying" ? <><Spinner size={15} color="#fff"/> Verificando…</> : "Ingresar →"}
                </button>

                <details style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", cursor: "pointer" }}>
                  <summary style={{ color: "#7c3aed", fontWeight: 600, listStyle: "none" }}>¿Olvidaste tu clave?</summary>
                  <div style={{ textAlign: "left", marginTop: 10, background: "#f8f7ff", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "12px 14px", fontSize: 11, lineHeight: 1.7, color: "#374151" }}>
                    <p style={{ fontWeight: 700, marginBottom: 6 }}>Podés recuperarla así:</p>
                    <p>1. Descargá la app <strong>Mi ARCA</strong> en tu celular (buscá "ARCA" en Play Store o App Store)</p>
                    <p>2. Elegí <strong>"Blanquear clave fiscal"</strong></p>
                    <p>3. Escaneá tu DNI y seguí los pasos</p>
                    <p style={{ marginTop: 8 }}><a href="https://www.arca.gob.ar/claveFiscal/" target="_blank" rel="noopener noreferrer" style={{ color: "#7c3aed", fontWeight: 600 }}>Más info en arca.gob.ar →</a></p>
                  </div>
                </details>
              </div>
            )}
          </>) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #d1fae5, #a7f3d0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>✅</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 4 }}>ARCA conectado</h3>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>Todo listo. A partir de ahora es automático.</p>
              <button onClick={() => setScreen("app")} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "14px 18px", cursor: "pointer" }}>Empezar →</button>
            </div>
          )}
        </div>
        {!arcaConnected && (
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => setScreen("login")} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>← Volver</button>
          </p>
        )}
      </div>
    </div>
  );
}
