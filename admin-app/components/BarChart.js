export default function BarChart({ data, labelKey = 'label', valueKey = 'hours', height = 220 }) {
  const width = 640;
  const padL = 8, padR = 8, padT = 10, padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const values = data.map((d) => d[valueKey] || 0);
  const max = Math.max(...values, 1) * 1.15;
  const gap = 14;
  const barW = data.length ? (innerW - gap * (data.length - 1)) / data.length : 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={padL} x2={width - padR} y1={padT + (innerH / 3) * i} y2={padT + (innerH / 3) * i} stroke="#F0F1F4" strokeWidth="1" />
      ))}
      <line x1={padL} x2={width - padR} y1={padT + innerH} y2={padT + innerH} stroke="#E7E8EC" strokeWidth="1" />
      {data.map((d, i) => {
        const v = d[valueKey] || 0;
        const h = (v / max) * innerH;
        const x = padL + i * (barW + gap);
        const y = padT + innerH - h;
        const opacity = 0.35 + (0.65 * i) / Math.max(1, data.length - 1);
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx="4" fill="#F2871F" opacity={opacity} />
            <text x={x + barW / 2} y={height - 4} fontSize="12" fill="#9AA0AA" textAnchor="middle">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}
