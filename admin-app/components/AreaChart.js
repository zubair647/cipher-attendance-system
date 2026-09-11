export default function AreaChart({ data, labelKey = 'label', valueKey = 'hours', height = 220 }) {
  const width = 640;
  const padL = 8, padR = 8, padT = 10, padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const values = data.map((d) => d[valueKey] || 0);
  const max = Math.max(...values, 1) * 1.15;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const pts = data.map((d, i) => {
    const x = padL + i * step;
    const y = padT + innerH - ((d[valueKey] || 0) / max) * innerH;
    return [x, y];
  });
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${padT + innerH} L${pts[0][0]},${padT + innerH} Z`;

  const gridLines = [0, 1, 2, 3].map((i) => padT + (innerH / 3) * i);
  const showEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {gridLines.map((y, i) => (
        <line key={i} x1={padL} x2={width - padR} y1={y} y2={y} stroke="#F0F1F4" strokeWidth="1" />
      ))}
      <line x1={padL} x2={width - padR} y1={padT + innerH} y2={padT + innerH} stroke="#E7E8EC" strokeWidth="1" />
      <path d={areaPath} fill="rgba(242,135,31,.09)" stroke="none" />
      <path d={linePath} fill="none" stroke="#F2871F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        if (isLast) return <circle key={i} cx={p[0]} cy={p[1]} r="6.5" fill="#F2871F" />;
        if (i % showEvery !== 0) return null;
        return <circle key={i} cx={p[0]} cy={p[1]} r="5.5" fill="#fff" stroke="#F2871F" strokeWidth="3" />;
      })}
      {data.map((d, i) => (
        i % showEvery === 0 || i === data.length - 1 ? (
          <text key={i} x={padL + i * step} y={height - 4} fontSize="12" fill="#9AA0AA" textAnchor="middle">
            {d[labelKey]}
          </text>
        ) : null
      ))}
    </svg>
  );
}
