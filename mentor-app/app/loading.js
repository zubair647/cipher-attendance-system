import Logo from '../components/Logo';

// Instant loading screen shown during navigation, so the user never sees a
// blank white flash while a page prepares.
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-canvas">
      <Logo size={44} />
      <div className="text-[14px] text-text-secondary">Loading…</div>
    </div>
  );
}
