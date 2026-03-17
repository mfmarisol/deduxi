export const Spinner = ({ size = 18, color = "#7c3aed" }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    border: `2.5px solid ${color}22`, borderTopColor: color,
    animation: "spin 0.7s linear infinite", flexShrink: 0,
  }}/>
);

export default Spinner;
