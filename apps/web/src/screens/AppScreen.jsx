import React from "react";
import { useApp, steps, statusConfig, fmt, cardStyle, siradigCategories, getCutoffInfo, topesAnuales2026, cargasFamiliaMontos2026, escalaGanancias2026 } from "../contexts/AppContext";
import { currentPeriodo } from "../utils/periodo";
import { LogoBrand } from "../components/LogoBrand";
import { Spinner } from "../components/Spinner";
import ComprobanteUpload from "../components/ComprobanteUpload";

export default function AppScreen() {
  const ctx = useApp();
  const {
    setScreen,
    cuit, setCuit, setClaveFiscal, setArcaConnected, setArcaPhase, setCaptchaImage, setCaptchaSessionId, setCaptchaSolution,
    step, setStep, showProfilePanel, setShowProfilePanel,
    editingClave, setEditingClave, newClaveFiscal, setNewClaveFiscal, showNewClave, setShowNewClave,
    savingClave, claveSaved,
    dragging, setDragging,
    setUploaded, analyzing, setAnalyzing, analyzed, setAnalyzed,
    presenting, setPresenting, presentProgress, setPresentProgress,
    arcaStatus, setArcaStatus, showRectModal, setShowRectModal, rectifying,
    isRectificativa, setIsRectificativa, rectVersion,
    ticketActions, setTicketActions, ticketEdits, setTicketEdits, editingTicketId, setEditingTicketId,
    tickets, setTickets, arcaFetched, setArcaFetched,
    addedTickets, setAddedTickets, showAddTicket, setShowAddTicket,
    newTicketForm, setNewTicketForm, ticketFile, setTicketFile, ticketFilePreview, setTicketFilePreview,
    rrhhEmail, setRrhhEmail, rrhhSaved, setRrhhSaved, savingRrhh, setSavingRrhh,
    avatarInitials, displayName, isMobile,
    totalApproved, totalRejected, totalPending, monthlySaving, resolvedCount,
    arcaDebugShot, arcaDebugInfo,
    handleUpdateClave, handlePresent, handleRectificar,
    classifyTicket,
    casasWorkers, casasPayments, casasTotalDeducible, casasLoading, casasFetched,
    cargasConyuge, setCargasConyuge, cargasHijos, setCargasHijos,
    cargasHijosIncapacitados, setCargasHijosIncapacitados,
    cuotaSindical, setCuotaSindical,
    sueldoBruto, setSueldoBruto,
    pluriempleo, setPluriempleo,
    alquilerData, setAlquilerData, alquilerDeduccionMensual,
    cargasFamiliaMensual, totalDeduccionesMensual, ahorroCalc,
  } = ctx;

  const cutoff = getCutoffInfo();
  const [cutoffDismissed, setCutoffDismissed] = React.useState(() => {
    const saved = localStorage.getItem("deduxi_cutoff_dismissed");
    if (!saved) return false;
    // Reset dismissal each month
    const [month, year] = saved.split("-").map(Number);
    const now = new Date();
    return month === now.getMonth() && year === now.getFullYear();
  });
  const dismissCutoff = () => {
    const now = new Date();
    localStorage.setItem("deduxi_cutoff_dismissed", `${now.getMonth()}-${now.getFullYear()}`);
    setCutoffDismissed(true);
  };

  return (
    <div className="app-bg" style={{ minHeight: "100vh" }}>

      {/* -- NAVBAR -- */}
      <nav className="app-nav" style={{
        padding: isMobile ? "0 16px" : "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoBrand size={isMobile ? 28 : 32} />
          <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, letterSpacing: "-0.5px" }}>
            <span className="ai-gradient-text">DEDUXI</span>
          </span>
        </div>

        {/* Step nav */}
        <div className="nav-steps">
          {steps.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", transition: "all 0.2s",
              background: step === i ? "linear-gradient(135deg, #a78bfa, #06b6d4)" : "rgba(124,58,237,0.04)",
              color: step === i ? "#fff" : "#7c3aed",
              boxShadow: step === i ? "0 4px 16px rgba(124,58,237,0.3)" : "none",
              letterSpacing: step === i ? "0.02em" : "normal",
            }}>{s}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {ctx.savedFeedback && (
            <span style={{ fontSize: 10, fontWeight: 600, color: "#10b981", opacity: ctx.savedFeedback ? 1 : 0, transition: "opacity 0.3s" }}>Guardado ✓</span>
          )}
          <div className="arca-badge" style={{ alignItems: "center", gap: 6, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 99, padding: "4px 10px" }}>
            <span className="status-dot" style={{ background: "#10b981", color: "#10b981" }}/>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#10b981" }}>ARCA</span>
          </div>
          <button onClick={() => { setShowProfilePanel(true); setEditingClave(false); ctx.setClaveSaved(false); }} style={{
            width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: avatarInitials.length <= 2 && !/\p{Emoji}/u.test(avatarInitials) ? 10 : 16, boxShadow: "0 2px 8px rgba(124,58,237,0.3)", flexShrink: 0,
          }}>{avatarInitials}</button>
        </div>
      </nav>

      {/* -- CONTENT -- */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "20px 14px 120px" : "32px 20px 120px" }}>

        {/* Banner rectificativa */}
        {isRectificativa && step > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, #faf5ff, #ede9fe)", border: "1.5px solid #ddd6fe", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg, #a78bfa, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🔄</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#5b21b6" }}>Corrección {currentPeriodo} - Rectificativa {rectVersion}</p>
              <p style={{ fontSize: 11, color: "#7c3aed", marginTop: 1 }}>Revisá los comprobantes, actualizá lo que cambió y volvé a presentar.</p>
            </div>
            <button onClick={() => { setIsRectificativa(false); setStep(3); setArcaStatus("sent"); }} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Cancelar</button>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 0: INICIO — Dashboard limpio                            */}
        {/* ============================================================ */}
        {step === 0 && (() => {
          const openSection = ctx.openDatosSection;
          const setOpenSection = (key) => ctx.setOpenDatosSection(openSection === key ? null : key);
          return (
          <div>
            {/* Cutoff banner removed — depends on each employer's payroll schedule */}

            {/* Hero — the ONE number that matters */}
            <div className="glow-border-pulse hero-shimmer card-enter" style={{ ...cardStyle, marginBottom: 20, padding: 0, overflow: "hidden", borderRadius: 24 }}>
              <div style={{ padding: isMobile ? "28px 20px 20px" : "32px 28px 24px", background: "linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(6,182,212,0.02) 100%)", textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.06)", borderRadius: 99, padding: "4px 12px", marginBottom: 16 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 8px rgba(124,58,237,0.4)" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.08em" }}>{currentPeriodo}</span>
                </div>
                {tickets.length === 0 && monthlySaving === 0 ? (
                  <>
                    <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#111827", marginBottom: 6 }}>Empezá a deducir</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                      Importá tus comprobantes y completá tus datos para calcular tu ahorro en Ganancias.
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      <span className="ai-gradient-text" style={{ fontSize: isMobile ? 36 : 44, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1 }}>
                        {monthlySaving > 0 ? `+${fmt(monthlySaving)}` : fmt(totalApproved)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 16 }}>
                      {monthlySaving > 0 ? "más en tu sueldo cada mes" : "en deducciones identificadas"}
                    </p>
                    {/* counter removed per user request */}
                  </>
                )}
              </div>
            </div>


            {/* Primary CTA */}
            <button onClick={() => setStep(1)} className="gradient-btn" style={{
              width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer", marginBottom: 20,
            }}>{tickets.length === 0 ? "Importar comprobantes →" : "Ver mis comprobantes →"}</button>

            {/* Collapsible data sections */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Datos personales</p>

            {/* Sueldo bruto — accordion */}
            <div style={{ ...cardStyle, marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setOpenSection("sueldo")} aria-expanded={openSection === "sueldo"} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>💰</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>Sueldo bruto</span>
                {sueldoBruto > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{fmt(sueldoBruto)}</span>}
                {ctx.aportesLoading && <span className="ai-pulse" style={{ fontSize: 9, color: "#7c3aed", fontWeight: 600 }}>Importando…</span>}
                <span style={{ fontSize: 10, color: "#9ca3af", transform: openSection === "sueldo" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>
              {openSection === "sueldo" && (
                <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <input type="text" inputMode="numeric" placeholder="Ej: 2.500.000"
                    value={sueldoBruto ? sueldoBruto.toLocaleString("es-AR") : ""}
                    onChange={e => { const v = e.target.value.replace(/\./g, "").replace(",", "."); setSueldoBruto(parseFloat(v) || 0); }}
                    className="input-field" style={{ fontSize: 14, fontWeight: 700, padding: "8px 12px" }} />
                  {ctx.aportesEmpleador && <p style={{ fontSize: 10, color: "#059669" }}>Empleador: {ctx.aportesEmpleador}</p>}
                  {ctx.aportesFetched && sueldoBruto > 0 && (
                    <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>✓ Importado de ARCA</span>
                  )}
                  {ctx.aportesFetched && !sueldoBruto && (
                    <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 600 }}>⚠ No se encontró sueldo bruto en ARCA. Ingresalo manualmente.</span>
                  )}
                  {ctx.aportesLoading && (
                    <span style={{ fontSize: 9, color: "#7c3aed", fontWeight: 600 }}>Buscando en ARCA...</span>
                  )}
                </div>
              )}
            </div>

            {/* Cargas de familia — accordion */}
            <div style={{ ...cardStyle, marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setOpenSection("cargas")} aria-expanded={openSection === "cargas"} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>👨‍👩‍👧‍👦</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>Cargas de familia</span>
                {cargasFamiliaMensual > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>{fmt(cargasFamiliaMensual)}/mes</span>}
                <span style={{ fontSize: 10, color: "#9ca3af", transform: openSection === "cargas" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>
              {openSection === "cargas" && (
                <div style={{ padding: "0 16px 14px" }}>
                  {/* Add buttons */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {!cargasConyuge && <button onClick={() => setCargasConyuge(true)} style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "#faf5ff", border: "1.5px dashed #ddd6fe", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>+ Cónyuge</button>}
                    <button onClick={() => setCargasHijos(cargasHijos + 1)} style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "#faf5ff", border: "1.5px dashed #ddd6fe", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>+ Hijo/a &lt;18</button>
                    <button onClick={() => setCargasHijosIncapacitados(cargasHijosIncapacitados + 1)} style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "#faf5ff", border: "1.5px dashed #ddd6fe", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>+ Hijo/a incap.</button>
                  </div>
                  {/* List of cargas with CUIL + porcentaje */}
                  {ctx.cargasFamilia.map((c, idx) => {
                    const tipoLabel = c.tipo === "conyuge" ? "💍 Cónyuge" : c.tipo === "hijo_incapacitado" ? "♿ Hijo/a incapacitado/a" : "👶 Hijo/a menor de 18";
                    const updateCarga = (field, val) => ctx.setCargasFamilia(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
                    return (
                      <div key={idx} style={{ background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#5b21b6" }}>{tipoLabel}</span>
                          <button onClick={() => ctx.setCargasFamilia(prev => prev.filter((_, i) => i !== idx))}
                            style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>CUIL *</label>
                            <input className="input-field" placeholder="20-12345678-9" value={c.cuil || ""}
                              onChange={e => updateCarga("cuil", e.target.value)}
                              style={{ fontSize: 12, padding: "6px 10px" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>% deducción</label>
                            <select className="input-field" value={c.porcentaje || 100}
                              onChange={e => updateCarga("porcentaje", Number(e.target.value))}
                              style={{ fontSize: 12, padding: "6px 10px" }}>
                              <option value={100}>100%</option>
                              <option value={50}>50%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {cargasFamiliaMensual > 0 ? (
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, padding: "5px 10px", background: "#faf5ff", borderRadius: 6, fontSize: 11 }}>
                      <span style={{ color: "#7c3aed", fontWeight: 600 }}>Deducción por cargas</span>
                      <span style={{ color: "#5b21b6", fontWeight: 700 }}>{fmt(cargasFamiliaMensual)}/mes</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, lineHeight: 1.4 }}>Si tenés cónyuge o hijos a cargo sin ingresos propios, agregalos acá. Necesitás su CUIL.</p>
                  )}
                </div>
              )}
            </div>

            {/* Cuota sindical — accordion */}
            <div style={{ ...cardStyle, marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setOpenSection("sindical")} aria-expanded={openSection === "sindical"} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>🏛️</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>Cuota sindical</span>
                {cuotaSindical > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{fmt(cuotaSindical)}/mes</span>}
                <span style={{ fontSize: 10, color: "#9ca3af", transform: openSection === "sindical" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>
              {openSection === "sindical" && (
                <div style={{ padding: "0 16px 14px" }}>
                  <div className="form-row-2" style={{ marginBottom: 6 }}>
                    <div style={{ flex: 2 }}>
                      <input type="text" inputMode="numeric" placeholder="Ej: 25.000"
                        value={cuotaSindical ? cuotaSindical.toLocaleString("es-AR") : ""}
                        onChange={e => { const v = e.target.value.replace(/\./g, "").replace(",", "."); setCuotaSindical(parseFloat(v) || 0); }}
                        className="input-field" style={{ fontSize: 14, fontWeight: 600, padding: "8px 12px" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select className="input-field" value={ctx.cuotaSindicalDesde} onChange={e => ctx.setCuotaSindicalDesde(Number(e.target.value))} style={{ fontSize: 11, padding: "8px 6px" }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Desde {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <select className="input-field" value={ctx.cuotaSindicalHasta} onChange={e => ctx.setCuotaSindicalHasta(Number(e.target.value))} style={{ fontSize: 11, padding: "8px 6px" }}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Hasta {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                      </select>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, lineHeight: 1.4 }}>Monto mensual que te descuentan en tu recibo de sueldo, en pesos ($).</p>
                </div>
              )}
            </div>

            {/* Alquiler — accordion */}
            <div style={{ ...cardStyle, marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setOpenSection("alquiler")} aria-expanded={openSection === "alquiler"} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>🏠</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>Alquiler de vivienda</span>
                {alquilerData.activo && alquilerDeduccionMensual > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{fmt(alquilerDeduccionMensual)}/mes</span>}
                <span style={{ fontSize: 10, color: "#9ca3af", transform: openSection === "alquiler" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>
              {openSection === "alquiler" && (
                <div style={{ padding: "0 16px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: alquilerData.activo ? 12 : 0 }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>RG 4003 — 40% deducible</span>
                    <div style={{ width: 42, height: 24, borderRadius: 99, background: alquilerData.activo ? "#7c3aed" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                      onClick={() => setAlquilerData(d => ({ ...d, activo: !d.activo }))}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: alquilerData.activo ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}/>
                    </div>
                  </div>
                  {alquilerData.activo && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="form-row-2">
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 4 }}>CUIT Locador</label>
                          <input className="input-field" placeholder="20-00000000-0" value={alquilerData.cuitLocador}
                            onChange={e => setAlquilerData(d => ({ ...d, cuitLocador: e.target.value }))} style={{ fontSize: 12, borderColor: alquilerData.cuitLocador && !(/^\d{2}-?\d{8}-?\d$/.test(alquilerData.cuitLocador.replace(/\s/g, ""))) ? "#f87171" : undefined }} />
                          {alquilerData.cuitLocador && (/^\d{2}-?\d{8}-?\d$/.test(alquilerData.cuitLocador.replace(/\s/g, ""))
                            ? <span style={{ fontSize: 9, color: "#10b981", fontWeight: 600 }}>✓ CUIT válido</span>
                            : <span style={{ fontSize: 9, color: "#f87171", fontWeight: 600 }}>Formato: XX-XXXXXXXX-X</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Nombre Locador</label>
                          <input className="input-field" placeholder="Apellido, Nombre" value={alquilerData.nombreLocador}
                            onChange={e => setAlquilerData(d => ({ ...d, nombreLocador: e.target.value }))} style={{ fontSize: 12 }} />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Monto mensual ($)</label>
                          <input className="input-field" type="number" placeholder="0" value={alquilerData.montoMensual || ""}
                            onChange={e => setAlquilerData(d => ({ ...d, montoMensual: parseFloat(e.target.value) || 0 }))} style={{ fontSize: 14, fontWeight: 600 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Desde mes</label>
                          <select className="input-field" value={alquilerData.mesDesde || 1} onChange={e => setAlquilerData(d => ({ ...d, mesDesde: Number(e.target.value) }))} style={{ fontSize: 12 }}>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Hasta mes</label>
                          <select className="input-field" value={alquilerData.mesHasta || 12} onChange={e => setAlquilerData(d => ({ ...d, mesHasta: Number(e.target.value) }))} style={{ fontSize: 12 }}>
                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                          </select>
                        </div>
                      </div>
                      {alquilerData.montoMensual > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", background: "#ecfdf5", borderRadius: 8, fontSize: 12 }}>
                          <span style={{ color: "#059669", fontWeight: 600 }}>Deducción mensual (40%)</span>
                          <span style={{ color: "#065f46", fontWeight: 700 }}>{fmt(alquilerDeduccionMensual)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pluriempleo — accordion */}
            <div style={{ ...cardStyle, marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setOpenSection("pluriempleo")} aria-expanded={openSection === "pluriempleo"} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>🏢</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>Pluriempleo</span>
                {ctx.aportesFetched && pluriempleo.length === 0 && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#059669", background: "#ecfdf5", padding: "2px 8px", borderRadius: 99 }}>
                    {ctx.aportesEmpleador ? `${ctx.aportesCuitEmpleador ? ctx.aportesCuitEmpleador + " - " : ""}${ctx.aportesEmpleador}` : "1 empleador"} ✓
                  </span>
                )}
                {pluriempleo.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", background: "#fef2f2", padding: "2px 8px", borderRadius: 99 }}>{pluriempleo.length + 1} empleadores</span>}
                <span style={{ fontSize: 10, color: "#9ca3af", transform: openSection === "pluriempleo" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>
              {openSection === "pluriempleo" && (
                <div style={{ padding: "0 16px 14px" }}>
                  {/* Show detected employer from ARCA */}
                  {ctx.aportesFetched && ctx.aportesEmpleador && (
                    <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#059669", textTransform: "uppercase", marginBottom: 4 }}>Empleador principal (importado de ARCA)</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{ctx.aportesEmpleador}</p>
                      {ctx.aportesCuitEmpleador && <p style={{ fontSize: 10, color: "#6b7280" }}>CUIT: {ctx.aportesCuitEmpleador}</p>}
                      {sueldoBruto > 0 && <p style={{ fontSize: 10, color: "#6b7280" }}>Sueldo bruto: {fmt(sueldoBruto)}</p>}
                    </div>
                  )}

                  {pluriempleo.length === 0 && (
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                      {ctx.aportesFetched
                        ? "Solo se detectó un empleador. Si tenés otro empleo, agregalo abajo."
                        : "Si tenés más de un empleador, agregalos acá."}
                    </p>
                  )}
                  {pluriempleo.length > 0 && (
                    <p style={{ fontSize: 10, color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>Empleadores adicionales:</p>
                  )}
                  {pluriempleo.map((emp, idx) => (
                    <div key={idx} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>Empleador {idx + 2}</span>
                        <button onClick={() => setPluriempleo(prev => prev.filter((_, i) => i !== idx))}
                          style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div className="form-row-2">
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>CUIT</label>
                            <input className="input-field" placeholder="30-00000000-0" value={emp.cuitEmpleador}
                              onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, cuitEmpleador: v } : p)); }}
                              style={{ fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Razón social</label>
                            <input className="input-field" placeholder="Nombre empresa" value={emp.razonSocial}
                              onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, razonSocial: v } : p)); }}
                              style={{ fontSize: 12 }} />
                          </div>
                        </div>
                        <div className="form-row-2">
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Sueldo bruto mensual ($)</label>
                            <input className="input-field" type="number" placeholder="0" value={emp.sueldoBrutoMensual}
                              onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, sueldoBrutoMensual: v } : p)); }}
                              style={{ fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Retención Ganancias ($)</label>
                            <input className="input-field" type="number" placeholder="0" value={emp.retencionGanancias || ""}
                              onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, retencionGanancias: v } : p)); }}
                              style={{ fontSize: 12 }} />
                          </div>
                        </div>
                        <div className="form-row-2">
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Aporte seg. social ($)</label>
                            <input className="input-field" type="number" placeholder="0" value={emp.aporteSegSocial || ""}
                              onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, aporteSegSocial: v } : p)); }}
                              style={{ fontSize: 12 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Aporte obra social ($)</label>
                            <input className="input-field" type="number" placeholder="0" value={emp.aporteObraSocial || ""}
                              onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, aporteObraSocial: v } : p)); }}
                              style={{ fontSize: 12 }} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Aporte sindical ($)</label>
                          <input className="input-field" type="number" placeholder="0" value={emp.aporteSindical || ""}
                            onChange={e => { const v = e.target.value; setPluriempleo(prev => prev.map((p, i) => i === idx ? { ...p, aporteSindical: v } : p)); }}
                            style={{ fontSize: 12, width: "100%" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setPluriempleo(prev => [...prev, { cuitEmpleador: "", razonSocial: "", sueldoBrutoMensual: "", aporteSegSocial: "", aporteObraSocial: "", aporteSindical: "", retencionGanancias: "" }])}
                    style={{ width: "100%", fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#faf5ff", border: "1.5px dashed #ddd6fe", borderRadius: 8, padding: "8px", cursor: "pointer" }}>+ Agregar otro empleador</button>
                </div>
              )}
            </div>

            {/* Empleada doméstica — accordion */}
            <div style={{ ...cardStyle, marginBottom: 8, padding: 0, overflow: "hidden" }}>
              <button onClick={() => setOpenSection("domestica")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 16 }}>🏡</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#111827" }}>Empleada doméstica</span>
                {casasLoading && <span className="ai-pulse" style={{ fontSize: 9, color: "#7c3aed", fontWeight: 600 }}>Buscando en ARCA...</span>}
                {casasFetched && casasWorkers.length > 0 && (() => {
                  // Show last month's payment as the header amount (what you'll add this month)
                  const allPaid = (ctx.casasPayments || []).filter(p => p.totalPagado > 0).sort((a, b) => {
                    const [am, ay] = (a.periodo || "").split("/").map(Number);
                    const [bm, by] = (b.periodo || "").split("/").map(Number);
                    return (by * 12 + bm) - (ay * 12 + am);
                  });
                  const lastMonthAmt = allPaid[0]?.totalPagado || 0;
                  return <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>{fmt(lastMonthAmt)}</span>;
                })()}
                {casasFetched && casasWorkers.length === 0 && !casasLoading && <span style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic" }}>Sin registros en ARCA</span>}
                <span style={{ fontSize: 10, color: "#9ca3af", transform: openSection === "domestica" ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </button>
              {openSection === "domestica" && (
                <div style={{ padding: "0 16px 14px" }}>
                  {casasLoading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0" }}><Spinner size={14} /><span style={{ fontSize: 11, color: "#7c3aed" }}>Buscando en ARCA...</span></div>
                  )}
                  {casasFetched && casasWorkers.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {casasWorkers.map((w, i) => {
                        // Find payments for this worker, sorted most recent first
                        const workerPayments = (ctx.casasPayments || [])
                          .filter(p => p.cuil === w.cuil && p.totalPagado > 0)
                          .sort((a, b) => {
                            const [am, ay] = (a.periodo || "").split("/").map(Number);
                            const [bm, by] = (b.periodo || "").split("/").map(Number);
                            return (by * 12 + bm) - (ay * 12 + am);
                          });
                        const latestPayment = workerPayments[0] || null;
                        // Worker display name: clean scraped name (remove table headers that leak in)
                        let rawName = (w.nombre || "").replace(/Pagos\s+y\s+recibos.*/i, "").replace(/Per[ií]odo\s+Pago.*/i, "").replace(/Estado\s+del\s+(pago|recibo).*/i, "").replace(/Sueldo\s+Estado.*/i, "").replace(/Detalle\s+del\s+pago.*/i, "").trim();
                        const displayName = (rawName && rawName.length > 2 && !/^[A-Za-z0-9+/=]{20,}$/.test(rawName))
                          ? rawName.split(/\s+/).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ")
                          : (w.cuil ? `Trabajador/a ${w.cuil}` : "Personal doméstico");
                        const displayCuil = (w.cuil && !/^[A-Za-z0-9+/=]{20,}$/.test(w.cuil)) ? w.cuil : null;
                        return (
                          <div key={i} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{displayName}</p>
                                {displayCuil && <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>CUIL: {displayCuil}</p>}
                                {w.categoria && <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{w.categoria}</p>}
                              </div>
                              {w.estado && (
                                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                                  background: /activ/i.test(w.estado) ? "#ecfdf5" : "#fef2f2",
                                  color: /activ/i.test(w.estado) ? "#059669" : "#dc2626",
                                  border: `1px solid ${/activ/i.test(w.estado) ? "#a7f3d0" : "#fecaca"}`
                                }}>{w.estado}</span>
                              )}
                            </div>
                            {latestPayment && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #d1fae5", display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                <span style={{ color: "#6b7280" }}>Último pago: {latestPayment.periodo}</span>
                                <span style={{ fontWeight: 700, color: "#059669" }}>{fmt(latestPayment.totalPagado)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {casasFetched && casasWorkers.length === 0 && !casasLoading && (
                    <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "8px 0" }}>Sin registros en Casas Particulares de ARCA.</p>
                  )}
                  {/* Manual domestic worker form */}
                  <div style={{ marginTop: 8, borderTop: casasWorkers.length > 0 ? "1px solid #d1fae5" : "none", paddingTop: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>
                      {casasWorkers.length > 0 ? "Agregar manualmente" : "Cargar personal doméstico"}
                    </p>
                    {(ctx.casasManual || []).map((w, idx) => (
                      <div key={idx} style={{ background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#5b21b6" }}>🏡 Personal {idx + 1}</span>
                          <button onClick={() => ctx.setCasasManual(prev => prev.filter((_, i) => i !== idx))}
                            style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                        </div>
                        <div className="form-row-2" style={{ marginBottom: 6 }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>CUIL *</label>
                            <input className="input-field" placeholder="27-12345678-9" value={w.cuil || ""}
                              onChange={e => ctx.setCasasManual(prev => prev.map((p, i) => i === idx ? { ...p, cuil: e.target.value } : p))}
                              style={{ fontSize: 12, padding: "6px 10px" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Monto mensual ($)</label>
                            <input className="input-field" type="number" placeholder="0" value={w.montoMensual || ""}
                              onChange={e => ctx.setCasasManual(prev => prev.map((p, i) => i === idx ? { ...p, montoMensual: e.target.value } : p))}
                              style={{ fontSize: 12, padding: "6px 10px" }} />
                          </div>
                        </div>
                        <div className="form-row-2">
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Desde</label>
                            <select className="input-field" value={w.mesDesde || 1} onChange={e => ctx.setCasasManual(prev => prev.map((p, i) => i === idx ? { ...p, mesDesde: Number(e.target.value) } : p))} style={{ fontSize: 11, padding: "6px" }}>
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Hasta</label>
                            <select className="input-field" value={w.mesHasta || 12} onChange={e => ctx.setCasasManual(prev => prev.map((p, i) => i === idx ? { ...p, mesHasta: Number(e.target.value) } : p))} style={{ fontSize: 11, padding: "6px" }}>
                              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m-1]}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => ctx.setCasasManual(prev => [...(prev || []), { cuil: "", montoMensual: "", mesDesde: 1, mesHasta: 12 }])}
                      style={{ width: "100%", fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#faf5ff", border: "1.5px dashed #ddd6fe", borderRadius: 8, padding: "8px", cursor: "pointer" }}>+ Agregar personal doméstico</button>
                  </div>
                </div>
              )}
            </div>

            {/* Compact savings summary — only if data exists */}
            {monthlySaving > 0 && sueldoBruto > 0 && ahorroCalc.metodo === "real" && (
              <div style={{ ...cardStyle, marginTop: 12, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", padding: "14px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ahorro estimado</p>
                    <p style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>Sin deducciones te retienen {fmt(ahorroCalc.impuestoSin)}, con deducciones solo {fmt(ahorroCalc.impuestoCon)}</p>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>+{fmt(monthlySaving)}</span>
                </div>
              </div>
            )}
          </div>
          );
        })()}
        {/* ============================================================ */}
        {/* STEP 1: COMPROBANTES                                          */}
        {/* ============================================================ */}
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
                <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>Revisa tus comprobantes</h2>
                <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 20 }}>Indica que cambio respecto a la presentación anterior.</p>

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
                            <p style={{ fontSize: 11, color: "#9ca3af" }}>{edit.date || t.date} - {edit.amount ? fmt(Number(edit.amount)) : fmt(t.amount)}</p>
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
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>➕ Comprobantes nuevos</span>
                      <span style={{ fontSize: 10, background: "#faf5ff", border: "1px solid #ddd6fe", color: "#7c3aed", borderRadius: 99, padding: "1px 8px", fontWeight: 700 }}>{addedTickets.length}</span>
                    </div>
                    {addedTickets.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", borderBottom: i < addedTickets.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                        <span style={{ fontSize: 16 }}>🧾</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider || "Nuevo comprobante"}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} - {t.type}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>{t.amount ? fmt(Number(t.amount)) : "—"}</span>
                        <button onClick={() => setAddedTickets(a => a.filter((_, j) => j !== i))} style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                {!showAddTicket && (
                  <button onClick={() => setShowAddTicket(true)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", border: "1.5px dashed #ddd6fe", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 600, color: "#7c3aed", cursor: "pointer", marginBottom: 16 }}>➕ Agregar comprobante nuevo</button>
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

                <button onClick={() => { setAnalyzing(true); setTimeout(() => { setTickets(prev => prev.map(t => ({ ...t, ...classifyTicket(t) }))); setAnalyzing(false); setAnalyzed(true); setStep(2); }, 2200); }} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer" }}>✨ Re-analizar y clasificar →</button>
              </div>
            );
          }

          // -- MODO NORMAL: comprobantes --
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
              reason: "Pendiente de clasificación",
              siradigCategory: "por_confirmar",
            };
            setTickets(prev => [...prev, newT]);
            setShowAddTicket(false);
            setNewTicketForm({ provider: "", cuitProv: "", date: "", amount: "", number: "", type: "Factura B" });
          };
          const handleRemoveTicket = (id) => {
            const ticket = tickets.find(t => t.id === id);
            const nombre = ticket?.provider || "este comprobante";
            if (window.confirm(`¿Eliminar comprobante de ${nombre}? Esta acción no se puede deshacer.`)) {
              setTickets(prev => prev.filter(t => t.id !== id));
            }
          };
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
              <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 16 }}>Comprobantes — {currentPeriodo}</h2>

              {/* ARCA section */}
              {(() => {
                const arcaTickets = tickets.filter(t => t.source === "arca");
                if (arcaTickets.length > 0) return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                    <span style={{ fontSize: 14 }}>✅</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>{arcaTickets.length} importado{arcaTickets.length > 1 ? "s" : ""} de ARCA</span>
                  </div>
                );
                return null;
              })()}

              {/* Comprobantes list */}
              <div style={{ ...cardStyle, padding: 0, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1.5px solid #f5f3ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🧾 Todos los comprobantes</span>
                    {tickets.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "#faf5ff", border: "1px solid #ddd6fe", borderRadius: 99, padding: "1px 8px" }}>{tickets.length}</span>}
                  </div>
                  <button onClick={() => setShowAddTicket(v => !v)} className={showAddTicket ? "" : "gradient-btn"} style={{ fontSize: 12, fontWeight: 700, color: showAddTicket ? "#9ca3af" : "#fff", background: showAddTicket ? "#f3f4f6" : undefined, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>
                    {showAddTicket ? "✕ Cancelar" : "➕ Agregar"}
                  </button>
                </div>

                {/* Add ticket form */}
                {showAddTicket && (
                  <div style={{ padding: "14px 16px", background: "#faf5ff", borderBottom: "1.5px solid #ede9fe" }}>
                    {/* Upload zone */}
                    <div style={{ marginBottom: 14 }}>
                      <ComprobanteUpload
                        compact
                        userCuit={cuit}
                        onResult={(data) => {
                          // Auto-fill form from scan results
                          setNewTicketForm(f => ({
                            ...f,
                            provider: data.proveedor || f.provider,
                            cuitProv: data.cuitEmisor || f.cuitProv,
                            date: data.fecha || f.date,
                            amount: data.montoTotal != null ? String(data.montoTotal) : f.amount,
                            number: data.numero || f.number,
                            type: data.tipo || f.type,
                          }));
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 1, background: "#ddd6fe" }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>o completa manualmente</span>
                      <div style={{ flex: 1, height: 1, background: "#ddd6fe" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div className="form-row-2">
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Proveedor / Razón social *</label>
                          <input className="input-field" placeholder="Ej: OSDE, SWISS MEDICAL, etc." value={newTicketForm.provider} onChange={e => setNewTicketForm(f => ({ ...f, provider: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
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
                            {["Factura A","Factura B","Factura C","Ticket","Recibo","Nota de Crédito"].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>Monto ($) *</label>
                          <input className="input-field" type="number" placeholder="0.00" value={newTicketForm.amount} onChange={e => setNewTicketForm(f => ({ ...f, amount: e.target.value }))} style={{ padding: "8px 10px", fontSize: 12 }} />
                        </div>
                      </div>
                      <button onClick={() => { handleAddTicket(); setTicketFile(null); setTicketFilePreview(null); }} disabled={!newTicketForm.provider || !newTicketForm.amount} className="gradient-btn" style={{ color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 8, padding: "10px", cursor: !newTicketForm.provider || !newTicketForm.amount ? "not-allowed" : "pointer", opacity: !newTicketForm.provider || !newTicketForm.amount ? 0.5 : 1 }}>
                            ✓ Agregar comprobante
                      </button>
                    </div>
                  </div>
                )}

                {/* Ticket list */}
                {tickets.length === 0 && !showAddTicket ? (
                  <div style={{ padding: "20px 16px" }}>
                    <ComprobanteUpload
                      userCuit={cuit}
                      onResult={(data) => {
                        // Auto-add ticket from scan
                        const newT = {
                          id: Date.now(),
                          date: data.fecha || new Date().toLocaleDateString("es-AR"),
                          provider: (data.proveedor || "").toUpperCase(),
                          cuit: data.cuitEmisor || "—",
                          number: data.numero || "—",
                          type: data.tipo || "Factura B",
                          amount: data.montoTotal || 0,
                          status: "pending",
                          reason: "Pendiente de clasificación",
                          siradigCategory: "por_confirmar",
                          source: "scan",
                        };
                        setTickets(prev => [...prev, newT]);
                      }}
                    />
                    <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 10 }}>
                      O usa el boton <strong>Agregar</strong> para cargar manualmente
                    </p>
                  </div>
                ) : (
                  tickets.map((t, i) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: i % 2 === 0 ? "#fff" : "#faf9ff", borderBottom: i < tickets.length - 1 ? "1px solid #f5f3ff" : "none" }}>
                      <span style={{ fontSize: 16 }}>🧾</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} - {t.type}{t.source === "arca" ? " - ARCA" : ""}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", flexShrink: 0 }}>{fmt(t.amount)}</span>
                      <button onClick={() => handleRemoveTicket(t.id)} aria-label={`Eliminar comprobante de ${t.provider}`} style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>✕</button>
                    </div>
                  ))
                )}
              </div>

              {tickets.length > 0 && !analyzing && (
                <button onClick={handleAnalyze} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer" }}>
                  ✨ Clasificar {tickets.length} comprobante{tickets.length > 1 ? "s" : ""} →
                </button>
              )}
              {analyzing && (
                <div style={{ background: "#faf5ff", border: "1.5px solid #ede9fe", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", animation: `bounce 0.8s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}/>)}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9" }}>Clasificando según normativa fiscal...</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* STEP 2: ANÁLISIS — Grouped by SiRADIG category                */}
        {/* ============================================================ */}
        {step === 2 && (() => {
          if (!analyzed && tickets.length === 0) return (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🤖</div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Sin comprobantes clasificados</h2>
              <button onClick={() => setStep(1)} className="gradient-btn" style={{ color: "#fff", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 10, padding: "12px 24px", cursor: "pointer" }}>Ir a Comprobantes →</button>
            </div>
          );

          const deducibles = tickets.filter(t => t.status === "approved" || t.status === "loaded");
          const pendientes = tickets.filter(t => t.status === "pending");
          const rechazados = tickets.filter(t => t.status === "rejected");

          // Group deducibles by siradigCategory
          const categoryGroups = {};
          deducibles.forEach(t => {
            const cat = t.siradigCategory || "por_confirmar";
            if (!categoryGroups[cat]) categoryGroups[cat] = [];
            categoryGroups[cat].push(t);
          });

          return (
            <div>
              <div className="analysis-header">
                <div>
                  <h2 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>Análisis de deducciones</h2>
                </div>
                <div className="total-block" style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deduccion total</p>
                  <p style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: "#059669", letterSpacing: "-1px" }}>{fmt(totalApproved)}</p>
                </div>
              </div>

              {/* Classification progress */}
              {tickets.length > 0 && pendientes.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 12, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{tickets.length - pendientes.length} de {tickets.length} clasificados</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>{pendientes.length} pendiente{pendientes.length > 1 ? "s" : ""}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #10b981, #06b6d4)", width: `${((tickets.length - pendientes.length) / tickets.length * 100)}%`, transition: "width 0.3s ease" }} />
                    </div>
                  </div>
                </div>
              )}
              {tickets.length > 0 && pendientes.length === 0 && (
                <div style={{ ...cardStyle, marginBottom: 12, padding: "10px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>✅</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#059669" }}>Todo clasificado</span>
                  <button onClick={() => setStep(3)} style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer" }}>Ver borrador SiRADIG →</button>
                </div>
              )}

              {/* Paycheck impact — only from comprobantes */}
              {totalApproved > 0 && (
                <div style={{ ...cardStyle, marginBottom: 24, background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", border: "1.5px solid #a7f3d0" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                    <span style={{ fontSize: 24 }}>💰</span>
                    <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: "#065f46", letterSpacing: "-1px", lineHeight: 1 }}>{fmt(Math.round(totalApproved * (ahorroCalc.tasaEfectiva || 0.27)))}</span>
                    <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, marginBottom: 2 }}>menos de Ganancias por comprobantes</span>
                  </div>
                </div>
              )}

              {/* Deducibles grouped by SiRADIG category */}
              {Object.keys(categoryGroups).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>✅ Deducibles por categoria SiRADIG</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#059669", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 99, padding: "1px 8px" }}>{deducibles.length}</span>
                    <div style={{ flex: 1, height: 1, background: "#a7f3d0" }}/>
                  </div>

                  {Object.entries(categoryGroups).map(([catKey, catTickets]) => {
                    const catConfig = siradigCategories[catKey] || siradigCategories.por_confirmar;
                    const catTotal = catTickets.reduce((sum, t) => sum + t.amount, 0);
                    return (
                      <div key={catKey} style={{ ...cardStyle, marginBottom: 12, padding: 0, overflow: "hidden" }}>
                        <div style={{ padding: "12px 16px", background: catConfig.bg, borderBottom: `1.5px solid ${catConfig.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{catConfig.icon}</span>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: catConfig.color }}>{catConfig.shortLabel}</p>
                              <p style={{ fontSize: 10, color: catConfig.color, opacity: 0.8 }}>{catConfig.articulo}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: catConfig.color }}>{fmt(catTotal)}</p>
                            <p style={{ fontSize: 10, color: catConfig.color, opacity: 0.7 }}>{catTickets.length} comprobante{catTickets.length > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                        {catTickets.map((t, i) => (
                          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "10px 16px", borderBottom: i < catTickets.length - 1 ? "1px solid #f5f3ff" : "none", background: i % 2 === 0 ? "#fff" : "#fdfcff" }}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                              <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date} - {t.type}</p>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0 }}>{fmt(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pending */}
              {pendientes.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#d97706" }}>⏳ A confirmar</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 99, padding: "1px 8px" }}>{pendientes.length}</span>
                    <div style={{ flex: 1, height: 1, background: "#fde68a" }}/>
                  </div>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10, lineHeight: 1.5 }}>
                    Estos comprobantes no pudimos clasificarlos automáticamente. Elegí qué tipo de deducción es o marcalo como no deducible.
                  </p>
                  {pendientes.map(t => {
                    const isExpanded = ctx.confirmingTicketId === t.id;
                    const quickCategories = [
                      { key: "honorarios_medicos", label: "Médico", icon: "👨‍⚕️" },
                      { key: "prepaga", label: "Prepaga", icon: "🏥" },
                      { key: "educacion", label: "Educación", icon: "📚" },
                      { key: "seguro_vida", label: "Seguro vida", icon: "🛡️" },
                      { key: "seguro_retiro", label: "Retiro privado", icon: "🏦" },
                      { key: "donaciones", label: "Donación", icon: "🎁" },
                      { key: "hipotecario", label: "Hipotecario", icon: "🏦" },
                      { key: "indumentaria_equipamiento", label: "Equipamiento", icon: "💻" },
                      { key: "gastos_sepelio", label: "Sepelio", icon: "⚱️" },
                      { key: "sgr", label: "SGR", icon: "🤝" },
                      { key: "fondos_comunes_inversion", label: "FCI retiro", icon: "📊" },
                      { key: "vehiculo_corredores", label: "Vehículo", icon: "🚗" },
                      { key: "otras_deducciones", label: "Otra", icon: "📋" },
                    ];
                    return (
                    <div key={t.id} style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "13px 16px", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{t.date} - {t.type}</p>
                          <p style={{ fontSize: 11, color: "#d97706", marginTop: 3 }}>💬 {t.reason}</p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", flexShrink: 0, marginRight: 4 }}>{fmt(t.amount)}</span>
                        {/* Compact action buttons */}
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button onClick={() => ctx.setConfirmingTicketId(isExpanded ? null : t.id)} title="Es deducible" style={{
                            width: 32, height: 32, borderRadius: 8, border: "1px solid #a7f3d0", background: isExpanded ? "#059669" : "#ecfdf5",
                            color: isExpanded ? "#fff" : "#059669", fontSize: 14, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>✓</button>
                          <button onClick={() => {
                            setTickets(prev => prev.map(tk => tk.id === t.id ? { ...tk, status: "rejected", reason: "Marcado como no deducible" } : tk));
                            ctx.setConfirmingTicketId(null);
                          }} title="No aplica" style={{
                            width: 32, height: 32, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2",
                            color: "#dc2626", fontSize: 14, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>✗</button>
                        </div>
                      </div>
                      {/* Category selector */}
                      <div style={{ marginTop: isExpanded ? 8 : 0, display: "flex", flexWrap: "wrap", gap: 4, maxHeight: isExpanded ? 200 : 0, opacity: isExpanded ? 1 : 0, overflow: "hidden", transition: "all 0.2s ease-out" }}>
                          {quickCategories.map(cat => (
                            <button key={cat.key} onClick={() => {
                              const catInfo = siradigCategories[cat.key];
                              setTickets(prev => prev.map(tk => tk.id === t.id ? { ...tk, status: "approved", reason: catInfo.label + " – " + catInfo.articulo, siradigCategory: cat.key } : tk));
                              ctx.setConfirmingTicketId(null);
                            }} style={{
                              padding: "5px 10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff",
                              fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#374151", transition: "all 0.15s",
                            }}>{cat.icon} {cat.label}</button>
                          ))}
                        </div>
                    </div>
                    );
                  })}
                </div>
              )}

              {/* Rejected */}
              {rechazados.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>❌ No deducibles (gastos personales)</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 99, padding: "1px 8px" }}>{rechazados.length}</span>
                    <div style={{ flex: 1, height: 1, background: "#fecaca" }}/>
                  </div>
                  <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                    {rechazados.map((t, i) => (
                      <div key={t.id} style={{ padding: "10px 16px", borderBottom: i < rechazados.length - 1 ? "1px solid #fef2f2" : "none", background: i % 2 === 0 ? "#fff" : "#fffbfb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.provider}</p>
                            <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.date}</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", flexShrink: 0 }}>{fmt(t.amount)}</span>
                        </div>
                        <p style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>{t.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div style={{ ...cardStyle, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Resumen para SiRADIG</p>
                {[
                  { label: "✅ Deducibles (comprobantes)", value: fmt(totalApproved), color: "#059669" },
                  ...(cargasFamiliaMensual > 0 ? [{ label: "👨‍👩‍👧‍👦 Cargas de familia", value: fmt(cargasFamiliaMensual), color: "#7c3aed" }] : []),
                  ...(cuotaSindical > 0 ? [{ label: "🏛️ Cuota sindical", value: fmt(cuotaSindical), color: "#059669" }] : []),
                  ...(alquilerDeduccionMensual > 0 ? [{ label: "🏠 Alquiler (40%)", value: fmt(alquilerDeduccionMensual), color: "#059669" }] : []),
                  ...(pluriempleo.length > 0 ? [{ label: "🏢 Pluriempleo", value: `${pluriempleo.length} empleador${pluriempleo.length > 1 ? "es" : ""}`, color: "#dc2626" }] : []),
                  { label: "❌ No deducibles", value: fmt(totalRejected), color: "#dc2626" },
                  { label: "❓ A confirmar", value: fmt(totalPending), color: "#d97706" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f3ff" }}>
                    <span style={{ fontSize: 13, color: "#374151" }}>{r.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.value}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", borderTop: "1.5px solid #ede9fe", marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#5b21b6" }}>💰 Ahorro estimado en sueldo</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#5b21b6" }}>{fmt(monthlySaving)}</span>
                </div>
              </div>

              <button onClick={() => setStep(3)} className="gradient-btn" style={{ width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px", cursor: "pointer" }}>Ver borrador SiRADIG →</button>
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* STEP 3: BORRADOR SiRADIG (F.572 Web)                          */}
        {/* ============================================================ */}
        {step === 3 && (() => {
          const deducibles = tickets.filter(t => t.status === "approved" || t.status === "loaded");
          const borradorSections = {};
          deducibles.forEach(t => {
            const cat = t.siradigCategory || "por_confirmar";
            if (!borradorSections[cat]) borradorSections[cat] = [];
            borradorSections[cat].push(t);
          });
          const sectionEntries = Object.entries(borradorSections);
          // Usar totalApproved (ya tiene 40% honorarios y topes aplicados) en vez de sumar raw
          const casasMensual = casasTotalDeducible || 0;
          const totalBorrador = totalApproved + cargasFamiliaMensual + cuotaSindical + alquilerDeduccionMensual + casasMensual;

          // Group tickets by provider (CUIT) within each category — like the real F.572
          const groupByProvider = (catTickets) => {
            const groups = {};
            catTickets.forEach(t => {
              const key = t.cuit || t.provider;
              if (!groups[key]) groups[key] = { cuit: t.cuit, provider: t.provider, items: [] };
              groups[key].items.push(t);
            });
            return Object.values(groups);
          };

          // Get month name from date string
          const getMonth = (dateStr) => {
            if (!dateStr) return "—";
            const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
            const parts = dateStr.split(/[-/]/);
            const m = parseInt(parts[1] || parts[0]) - 1;
            return months[m] || dateStr;
          };

          const fmtCuit = (c) => {
            if (!c || c === "—") return "";
            const d = c.replace(/\D/g, "");
            if (d.length === 11) return `${d.slice(0,2)}-${d.slice(2,10)}-${d.slice(10)}`;
            return c;
          };

          return (
            <div>
              {/* Single borrador card container */}
              <div style={{ ...cardStyle, borderRadius: 16, padding: 0, overflow: "hidden", border: "1.5px solid rgba(139,92,246,0.20)", marginBottom: 20 }}>

              {/* F.572 Header */}
              <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(79,70,229,0.04))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <p style={{ fontSize: isMobile ? 9 : 10, color: "#8b5cf6", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Régimen de retenciones 4ta. Categoría</p>
                    <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.5px" }}>F.572 Web</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706", background: "rgba(217,119,6,0.1)", border: "1px solid rgba(217,119,6,0.25)", borderRadius: 99, padding: "4px 12px", letterSpacing: "0.05em", marginTop: 4 }}>BORRADOR</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 8 : 16, fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                  <span>CUIT: <strong style={{ color: "#111827" }}>{cuit ? cuit.replace(/\D/g, "").replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3") : "—"}</strong></span>
                  <span>Período: <strong style={{ color: "#111827" }}>{currentPeriodo}</strong></span>
                </div>
              </div>

              {/* ── SECCIÓN 1: Cargas de familia ── */}
              <div>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(139,92,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(139,92,246,0.04)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>1 - Cargas de familia</p>
                  <button onClick={() => setStep(0)} style={{ fontSize: 10, color: "#7c3aed", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                </div>
                {cargasFamiliaMensual > 0 ? (
                  <div>
                    {cargasConyuge && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", fontSize: 11 }}>
                        <span style={{ color: "#374151", fontWeight: 600 }}>Conyuge / Union convivencial</span>
                        <span style={{ color: "#374151" }}>{fmt(cargasFamiliaMontos2026.conyuge.mensual)}/mes</span>
                      </div>
                    )}
                    {cargasHijos > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", fontSize: 11 }}>
                        <span style={{ color: "#374151", fontWeight: 600 }}>Hijo/a menor de 18 x {cargasHijos}</span>
                        <span style={{ color: "#374151" }}>{fmt(cargasHijos * cargasFamiliaMontos2026.hijo.mensual)}/mes</span>
                      </div>
                    )}
                    {cargasHijosIncapacitados > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", fontSize: 11 }}>
                        <span style={{ color: "#374151", fontWeight: 600 }}>Hijo/a incapacitado/a x {cargasHijosIncapacitados}</span>
                        <span style={{ color: "#374151" }}>{fmt(cargasHijosIncapacitados * cargasFamiliaMontos2026.hijo_incapacitado.mensual)}/mes</span>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.04)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>{fmt(cargasFamiliaMensual)}/mes</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>Sin cargas declaradas. <span onClick={() => setStep(0)} style={{ color: "#7c3aed", cursor: "pointer", fontWeight: 600 }}>Completar en Inicio</span></p>
                  </div>
                )}
              </div>

              {/* ── SECCIÓN 2: Pluriempleo ── */}
              <div>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(139,92,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(139,92,246,0.04)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>2 - Ingresos de otros empleadores</p>
                  <button onClick={() => setStep(0)} style={{ fontSize: 10, color: "#7c3aed", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                </div>
                {pluriempleo.length > 0 ? (
                  <div>
                    {pluriempleo.map((emp, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", fontSize: 11 }}>
                        <span style={{ color: "#374151", fontWeight: 600 }}>{emp.cuitEmpleador ? `${emp.cuitEmpleador} - ` : ""}{emp.razonSocial || `Empleador ${i+1}`}</span>
                        <span style={{ color: "#374151" }}>{emp.sueldoBrutoMensual ? fmt(parseFloat(emp.sueldoBrutoMensual)) : "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "12px 16px" }}>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>Un solo empleador{ctx.aportesEmpleador ? ` (${ctx.aportesEmpleador})` : ""} — no aplica.</p>
                  </div>
                )}
              </div>

              {/* ── SECCIÓN 3: Deducciones y desgravaciones ── */}
              <div>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(139,92,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(139,92,246,0.04)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>3 - Deducciones y desgravaciones</p>
                  <button onClick={() => setStep(1)} style={{ fontSize: 10, color: "#7c3aed", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                </div>

                {(() => {
                  // Separate section 3 vs section 4 entries
                  const sec3Entries = sectionEntries.filter(([k]) => {
                    const cat = siradigCategories[k];
                    return cat && cat.seccion === 3;
                  });
                  const sec3Total = sec3Entries.reduce((sum, [, tix]) => sum + tix.reduce((s, t) => s + t.amount, 0), 0)
                    + cuotaSindical + (alquilerData.activo ? alquilerDeduccionMensual : 0) + casasMensual;

                  if (sec3Entries.length === 0 && cuotaSindical === 0 && !(alquilerData.activo && alquilerDeduccionMensual > 0) && casasMensual === 0) {
                    return (
                      <div style={{ padding: "16px", textAlign: "center" }}>
                        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Sin deducciones cargadas</p>
                        <button onClick={() => setStep(1)} className="gradient-btn" style={{ color: "#fff", fontWeight: 700, fontSize: 12, border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>Ir a Comprobantes</button>
                      </div>
                    );
                  }

                  return (
                    <>
                      {sec3Entries.map(([catKey, catTickets]) => {
                        const catConfig = siradigCategories[catKey] || siradigCategories.por_confirmar;
                        const sectionTotal = catTickets.reduce((sum, t) => sum + t.amount, 0);
                        const providerGroups = groupByProvider(catTickets);
                        return (
                          <div key={catKey}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.03)" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>{catConfig.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>{fmt(sectionTotal)}</span>
                            </div>
                            {providerGroups.map((pg, gi) => {
                              const provSubtotal = pg.items.reduce((sum, t) => sum + t.amount, 0);
                              return (
                                <div key={gi}>
                                  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 16px 3px 40px", fontSize: 11 }}>
                                    <span style={{ color: "#374151", fontWeight: 600 }}>{fmtCuit(pg.cuit)}{fmtCuit(pg.cuit) ? " - " : ""}{pg.provider}</span>
                                    {pg.items.length > 1 && <span style={{ color: "#6b7280", fontWeight: 500 }}>{fmt(provSubtotal)}</span>}
                                  </div>
                                  {pg.items.map((t, ti) => (
                                    <div key={ti} style={{ display: "flex", justifyContent: "space-between", padding: "2px 16px 2px 52px", fontSize: 10 }}>
                                      <span style={{ color: "#9ca3af" }}>{getMonth(t.date)}</span>
                                      <span style={{ color: "#6b7280" }}>{fmt(t.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {/* Cuota sindical */}
                      {cuotaSindical > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.03)" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>Cuotas sindicales</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>{fmt(cuotaSindical)}</span>
                        </div>
                      )}

                      {/* Alquiler */}
                      {alquilerData.activo && alquilerDeduccionMensual > 0 && (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.03)" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>Alquiler vivienda (40%)</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>{fmt(alquilerDeduccionMensual)}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 16px 3px 40px", fontSize: 10 }}>
                            <span style={{ color: "#6b7280" }}>{alquilerData.cuitLocador ? `${alquilerData.cuitLocador} - ` : ""}{alquilerData.nombreLocador || "Locador"}</span>
                            <span style={{ color: "#9ca3af" }}>{fmt(alquilerData.montoMensual)} x 40%</span>
                          </div>
                        </div>
                      )}

                      {/* Empleada doméstica (Ley 26.063 art. 16) */}
                      {casasMensual > 0 && (() => {
                        const currentYear = String(new Date().getFullYear());
                        const yearPayments = (ctx.casasPayments || [])
                          .filter(p => p.totalPagado > 0 && (p.periodo || "").endsWith(currentYear));
                        // Group by periodo — sum all workers' payments per month
                        const byPeriod = {};
                        yearPayments.forEach(p => {
                          if (!byPeriod[p.periodo]) byPeriod[p.periodo] = 0;
                          byPeriod[p.periodo] += p.totalPagado;
                        });
                        const periodEntries = Object.entries(byPeriod).sort((a, b) => {
                          const [am] = a[0].split("/").map(Number);
                          const [bm] = b[0].split("/").map(Number);
                          return bm - am;
                        });
                        const yearTotal = periodEntries.reduce((sum, [, amt]) => sum + amt, 0);
                        return (
                        <div>
                          <div style={{ padding: "8px 16px 4px 28px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.03)" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#5b21b6" }}>Personal de casas particulares</span>
                          </div>
                          {periodEntries.map(([periodo, amt], pi) => (
                            <div key={pi} style={{ display: "flex", justifyContent: "space-between", padding: "2px 16px 2px 40px", fontSize: 10 }}>
                              <span style={{ color: "#9ca3af" }}>{periodo}</span>
                              <span style={{ color: "#6b7280" }}>{fmt(amt)}</span>
                            </div>
                          ))}
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 16px 6px 40px", fontSize: 10, borderTop: "1px dashed rgba(139,92,246,0.15)", marginTop: 2 }}>
                            <span style={{ fontWeight: 700, color: "#5b21b6" }}>Acumulado {currentYear}</span>
                            <span style={{ fontWeight: 700, color: "#5b21b6" }}>{fmt(yearTotal)}</span>
                          </div>
                        </div>
                        );
                      })()}

                      {/* subtotal removed — shown only in TOTAL DEDUCCIONES at bottom */}
                    </>
                  );
                })()}
              </div>

              {/* ── SECCIÓN 4: Retenciones, Percepciones y Pagos a Cuenta ── */}
              <div>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(139,92,246,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(139,92,246,0.04)" }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>4 - Retenciones, Percepciones y Pagos a Cuenta</p>
                  <button onClick={() => setStep(1)} style={{ fontSize: 10, color: "#7c3aed", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                </div>
                {(() => {
                  const sec4Entries = sectionEntries.filter(([k]) => {
                    const cat = siradigCategories[k];
                    return cat && cat.seccion === 4;
                  });
                  const sec4Total = sec4Entries.reduce((sum, [, tix]) => sum + tix.reduce((s, t) => s + t.amount, 0), 0);

                  if (sec4Entries.length === 0 && (!ctx.retenciones || ctx.retenciones.length === 0)) {
                    const tiposRetencion = [
                      { key: "imp_cheque", label: "Imp. créditos y débitos bancarios", icon: "🏧" },
                      { key: "percep_aduana", label: "Percepciones/retenciones aduaneras", icon: "🛃" },
                      { key: "pago_cuenta_3819", label: "Pago a cuenta RG 3819 (efectivo)", icon: "💵" },
                      { key: "pago_cuenta_5617", label: "Pago a cuenta RG 5617/2024", icon: "💵" },
                      { key: "autoret_5683", label: "Autorretenciones RG 5683/2025", icon: "💵" },
                      { key: "otra", label: "Otra retención/percepción", icon: "📋" },
                    ];
                    return (
                      <div style={{ padding: "12px 16px" }}>
                        <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                          Cargá retenciones, percepciones y pagos a cuenta que no figuran en Mis Comprobantes.
                        </p>
                        {(ctx.retenciones || []).map((r, idx) => (
                          <div key={idx} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#2563eb" }}>{tiposRetencion.find(t => t.key === r.tipo)?.label || r.tipo}</span>
                              <button onClick={() => ctx.setRetenciones(prev => prev.filter((_, i) => i !== idx))}
                                style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>✕</button>
                            </div>
                            <div className="form-row-2">
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>CUIT agente</label>
                                <input className="input-field" placeholder="30-00000000-0" value={r.cuitAgente || ""}
                                  onChange={e => ctx.setRetenciones(prev => prev.map((p, i) => i === idx ? { ...p, cuitAgente: e.target.value } : p))}
                                  style={{ fontSize: 12, padding: "6px 10px" }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "block", marginBottom: 3 }}>Monto ($)</label>
                                <input className="input-field" type="number" placeholder="0" value={r.monto || ""}
                                  onChange={e => ctx.setRetenciones(prev => prev.map((p, i) => i === idx ? { ...p, monto: e.target.value } : p))}
                                  style={{ fontSize: 12, padding: "6px 10px" }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {tiposRetencion.map(tipo => (
                            <button key={tipo.key} onClick={() => ctx.setRetenciones(prev => [...(prev || []), { tipo: tipo.key, cuitAgente: "", monto: "", periodo: "" }])}
                              style={{ fontSize: 10, fontWeight: 600, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
                              {tipo.icon} {tipo.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <>
                      {sec4Entries.map(([catKey, catTickets]) => {
                        const catConfig = siradigCategories[catKey] || siradigCategories.por_confirmar;
                        const sectionTotal = catTickets.reduce((sum, t) => sum + t.amount, 0);
                        return (
                          <div key={catKey}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 28px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(99,102,241,0.04)" }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>{catConfig.label}</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>{fmt(sectionTotal)}</span>
                            </div>
                            {catTickets.map((t, ti) => (
                              <div key={ti} style={{ display: "flex", justifyContent: "space-between", padding: "3px 16px 3px 40px", fontSize: 10 }}>
                                <span style={{ color: "#6b7280" }}>{fmtCuit(t.cuit)} — {getMonth(t.date)}</span>
                                <span style={{ color: "#374151" }}>{fmt(t.amount)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px", borderTop: "1px solid rgba(139,92,246,0.1)", background: "rgba(139,92,246,0.04)" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Subtotal: {fmt(sec4Total)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* ── TOTAL GENERAL ── */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", borderTop: "1px solid rgba(139,92,246,0.15)" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>TOTAL DEDUCCIONES</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{fmt(totalBorrador)}</span>
              </div>

              </div>{/* close single borrador card container */}

              {(sectionEntries.length > 0 || cargasFamiliaMensual > 0 || cuotaSindical > 0) && (
                <>
                  {/* Tope warnings */}
                  {(() => {
                    const warnings = [];
                    sectionEntries.forEach(([catKey, catTickets]) => {
                      const total = catTickets.reduce((sum, t) => sum + t.amount, 0);
                      const tope = topesAnuales2026[catKey];
                      if (!tope) return;
                      if (tope.tope && total > tope.tope / 12) {
                        warnings.push({ cat: catKey, label: (siradigCategories[catKey] || {}).shortLabel, total, topeMsg: `Tope mensual aprox. ${fmt(Math.round(tope.tope / 12))}` });
                      }
                      if (tope.porcentaje && catKey === "honorarios_medicos") {
                        const deducible = total * tope.porcentaje;
                        if (deducible < total) warnings.push({ cat: catKey, label: "Honorarios médicos", total, topeMsg: `Solo se deduce 40%: ${fmt(Math.round(deducible))}` });
                      }
                    });
                    if (warnings.length === 0) return null;
                    return (
                      <div style={{ marginBottom: 16 }}>
                        {warnings.map((w, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "8px 14px", marginBottom: 6, fontSize: 11, color: "#92400e" }}>
                            <span>⚠️</span>
                            <span><strong>{w.label}</strong>: {w.topeMsg}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Impact explanation — now with real calculation */}
                  <div style={{ ...cardStyle, marginBottom: 20, background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", border: "1.5px solid #a7f3d0" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#065f46", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Impacto en tu recibo de sueldo</p>
                    {ahorroCalc.metodo === "real" ? (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #a7f3d0" }}>
                          <span style={{ fontSize: 12, color: "#374151" }}>Total que declarás</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmt(totalBorrador)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #a7f3d0" }}>
                          <span style={{ fontSize: 12, color: "#374151" }}>% que recuperás</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{(ahorroCalc.tasaEfectiva * 100).toFixed(0)}%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#065f46" }}>Vas a cobrar de más</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>+{fmt(monthlySaving)}<span style={{ fontSize: 11, fontWeight: 600 }}>/mes</span></span>
                        </div>
                        <p style={{ fontSize: 10, color: "#047857", marginTop: 6, lineHeight: 1.5 }}>
                          De cada $100 que declarás, ~${(ahorroCalc.tasaEfectiva * 100).toFixed(0)} vuelven a tu bolsillo.
                          {ahorroCalc.sueldoNeto > 0 && ` Neto estimado: ${fmt(ahorroCalc.sueldoNeto)}.`}
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #a7f3d0" }}>
                          <span style={{ fontSize: 12, color: "#374151" }}>Total que declarás</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{fmt(totalBorrador)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #a7f3d0" }}>
                          <span style={{ fontSize: 12, color: "#374151" }}>% que recuperás (aprox.)</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>~27%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: "#065f46" }}>Vas a cobrar de más</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>+{fmt(monthlySaving)}<span style={{ fontSize: 11, fontWeight: 600 }}>/mes</span></span>
                        </div>
                        <p style={{ fontSize: 10, color: "#047857", marginTop: 6, lineHeight: 1.5 }}>
                          Estimación. Ingresá tu sueldo bruto en Inicio para un % más preciso.
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Presentar — main CTA (disabled until feature ready) */}
              <button disabled style={{
                width: "100%", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 12, padding: "14px",
                cursor: "not-allowed", opacity: 0.5, marginBottom: 12,
                background: "linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                🚀 Presentar en ARCA
                <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,255,255,0.25)", padding: "2px 10px", borderRadius: 99, letterSpacing: "0.05em", textTransform: "uppercase" }}>Próximamente</span>
              </button>

              <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
                Estamos terminando la presentación automática. Por ahora, usá este borrador como guía para completar el F.572 en SiRADIG manualmente.
              </p>

              {/* Navigation back to edit */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, minWidth: 100, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px", fontSize: 11, fontWeight: 600, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>✏️ Editar datos personales</button>
                <button onClick={() => setStep(1)} style={{ flex: 1, minWidth: 100, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px", fontSize: 11, fontWeight: 600, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>✏️ Editar comprobantes</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, minWidth: 100, background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: "10px", fontSize: 11, fontWeight: 600, color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>✏️ Revisar análisis</button>
              </div>
            </div>
          );
        })()}

        {/* Legal disclaimer */}
        <p style={{ fontSize: 10, color: "#c4b5fd", textAlign: "center", marginTop: 32, lineHeight: 1.5 }}>
          Herramienta informativa conforme a RG 4003/2017. Consultá a un profesional ante dudas específicas.
        </p>
      </div>

      {/* -- PROFILE PANEL -- */}
      {showProfilePanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,12,41,0.3)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", justifyContent: "flex-end", alignItems: "flex-start", padding: "68px 16px 16px" }} onClick={() => setShowProfilePanel(false)}>
          <div style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", borderRadius: 20, padding: "20px", width: "100%", maxWidth: 280, boxShadow: "0 8px 48px rgba(15,12,41,0.15)", border: "1px solid rgba(139,92,246,0.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, borderBottom: "1.5px solid #f5f3ff", marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>{avatarInitials}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{displayName}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>ARCA conectado</p>
              </div>
              <button onClick={() => setShowProfilePanel(false)} aria-label="Cerrar perfil" style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, fontWeight: 700, padding: "0 4px", flexShrink: 0 }}>✕</button>
            </div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Cuenta ARCA</p>
            <div style={{ background: "#f8f7ff", border: "1.5px solid #f1f0ff", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>CUIT</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#374151", fontWeight: 600 }}>{cuit ? (cuit.includes("-") ? cuit : cuit.replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3")) : "—"}</span>
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
              <button onClick={() => { setShowProfilePanel(false); ["deduxi_screen","deduxi_cuit","deduxi_tickets","deduxi_arca_fetched"].forEach(k => localStorage.removeItem(k)); setTickets([]); setArcaFetched(false); setCuit(""); setClaveFiscal(""); setArcaConnected(false); setArcaPhase("cuit"); setCaptchaImage(null); setCaptchaSessionId(null); setCaptchaSolution(""); setScreen("login"); }} style={{ width: "100%", background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontWeight: 500 }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* -- BOTTOM NAV -- */}
      <div className="bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, display: "flex", zIndex: 30 }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} className={`bottom-nav-item${step === i ? " active" : ""}`} style={{
            flex: 1, padding: "10px 4px 14px", border: "none", background: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: step === i ? "#7c3aed" : "#9ca3af", fontSize: 10, fontWeight: step === i ? 700 : 600, transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 16, transition: "transform 0.2s", transform: step === i ? "scale(1.15)" : "scale(1)" }}>{["🏠","🧾","✨","📋"][i]}</span>
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
