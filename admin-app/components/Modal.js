export default function Modal({ width = 560, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[rgba(26,28,32,0.4)]" onClick={onClose} />
      <div
        className="relative bg-surface rounded-2xl shadow-modal w-full max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>
  );
}
