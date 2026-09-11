const VARIANTS = {
  present: 'bg-present-bg text-present-fg',
  leave: 'bg-leave-bg text-leave-fg',
  flagged: 'bg-flagged-bg text-flagged-fg',
  neutral: 'bg-canvas text-text-secondary border border-border',
};

export default function Pill({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-[5px] text-[13px] font-semibold ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
}
