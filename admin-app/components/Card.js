export default function Card({ children, className = '', padding = 'p-5' }) {
  return (
    <div className={`bg-surface rounded-2xl shadow-card ${padding} ${className}`}>
      {children}
    </div>
  );
}
