export default function Topbar({ title, context, children }) {
  return (
    <div className="h-[76px] shrink-0 bg-surface border-b border-border px-8 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[19px] font-semibold tracking-[-0.015em] truncate">{title}</div>
        {context && <div className="text-[13px] text-text-secondary mt-0.5 truncate">{context}</div>}
      </div>
      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}
