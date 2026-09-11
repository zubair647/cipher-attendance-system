export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="w-[38px] h-[22px] rounded-full relative transition-colors shrink-0 disabled:opacity-50"
      style={{ background: checked ? '#F2871F' : '#D7D9DE' }}
    >
      <span
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: checked ? 19 : 3 }}
      />
    </button>
  );
}
