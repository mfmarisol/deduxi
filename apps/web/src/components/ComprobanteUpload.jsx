import { useState, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://deduxi-api.onrender.com";

/**
 * ComprobanteUpload — Drag & drop or click to upload a comprobante image/PDF.
 * Sends to backend which uses Claude Vision to extract data.
 *
 * Props:
 * - onResult(data) — called with extracted comprobante data
 * - userCuit — the user's CUIT to validate against cuitReceptor
 * - compact — smaller version for inline use
 */
export default function ComprobanteUpload({ onResult, userCuit, compact = false }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WebP o PDF.");
      return;
    }

    // Validate size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Archivo demasiado grande (max 10 MB).");
      return;
    }

    setError(null);
    setResult(null);

    // Show preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview("pdf");
    }

    // Upload to backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/api/comprobantes/scan`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error || "No pudimos leer este comprobante. Verificá que sea una imagen clara de una factura.");
        setUploading(false);
        return;
      }

      const data = json.data;
      setResult(data);

      if (!data.esComprobante) {
        setError(`Esto no es un comprobante: ${data.motivo}`);
        setUploading(false);
        return;
      }

      // Validate CUIT if provided
      if (userCuit && data.cuitReceptor) {
        const userCuitClean = userCuit.replace(/\D/g, "");
        const receptorClean = (data.cuitReceptor || "").replace(/\D/g, "");
        if (receptorClean && receptorClean !== userCuitClean) {
          setError(`Este comprobante está dirigido a otro CUIT (${data.cuitReceptor}). Solo podés cargar comprobantes emitidos a tu CUIT ${userCuit}.`);
          setUploading(false);
          return;
        }
      }

      if (onResult) onResult(data);
    } catch (err) {
      setError("Error de conexión con el servidor. Intentá de nuevo.");
    } finally {
      setUploading(false);
    }
  }, [onResult, userCuit]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Compact result view ──
  if (result && result.esComprobante && !uploading) {
    return (
      <div style={{
        background: "#ecfdf5", border: "1.5px solid #a7f3d0", borderRadius: 10,
        padding: "12px 14px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Comprobante leido</p>
              <p style={{ fontSize: 11, color: "#6b7280" }}>{result.tipo} — Confianza {Math.round((result.confianza || 0) * 100)}%</p>
            </div>
          </div>
          <button onClick={reset} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>✕ Limpiar</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 12, color: "#374151" }}>
          {result.proveedor && <div><span style={{ color: "#9ca3af", fontWeight: 600 }}>Proveedor:</span> {result.proveedor}</div>}
          {result.cuitEmisor && <div><span style={{ color: "#9ca3af", fontWeight: 600 }}>CUIT emisor:</span> {result.cuitEmisor}</div>}
          {result.fecha && <div><span style={{ color: "#9ca3af", fontWeight: 600 }}>Fecha:</span> {result.fecha}</div>}
          {result.montoTotal != null && <div><span style={{ color: "#9ca3af", fontWeight: 600 }}>Total:</span> $ {result.montoTotal?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>}
          {result.numero && <div><span style={{ color: "#9ca3af", fontWeight: 600 }}>Nro:</span> {result.numero}</div>}
        </div>

        {result.items && result.items.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>
            <span style={{ fontWeight: 600 }}>Items:</span> {result.items.join(", ")}
          </div>
        )}
      </div>
    );
  }

  // ── Error state ──
  if (error && !uploading) {
    return (
      <div style={{
        background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10,
        padding: "12px 14px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>❌</span>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#dc2626" }}>{error}</p>
          </div>
          <button onClick={reset} style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Reintentar</button>
        </div>
      </div>
    );
  }

  // ── Upload / loading state ──
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? "#7c3aed" : "#ddd6fe"}`,
        borderRadius: 10,
        padding: compact ? "14px" : "20px",
        textAlign: "center",
        cursor: uploading ? "wait" : "pointer",
        background: dragging ? "#faf5ff" : "#fefefe",
        transition: "all 0.15s",
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {uploading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {preview && preview !== "pdf" && (
            <img src={preview} alt="preview" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, opacity: 0.6 }} />
          )}
          <div className="spinner" style={{ width: 24, height: 24, border: "3px solid #ede9fe", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>Leyendo comprobante...</p>
          <p style={{ fontSize: 11, color: "#9ca3af" }}>Extrayendo datos con IA</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: compact ? 24 : 32 }}>📸</span>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {compact ? "Subir foto/PDF" : "Arrastra o toca para subir comprobante"}
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af" }}>
            JPG, PNG, WebP o PDF — max 10 MB
          </p>
          <span style={{ display: "inline-block", fontSize: 9, fontWeight: 700, color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a", padding: "2px 10px", borderRadius: 99, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 2 }}>En pruebas</span>
        </div>
      )}
    </div>
  );
}
