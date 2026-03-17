export const LogoBrand = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
    background: "linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%)",
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

export default LogoBrand;
