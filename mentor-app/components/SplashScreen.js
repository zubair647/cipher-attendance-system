'use client';
import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'Waking up the database…',
  'Loading your details…',
  'We’re almost done…',
  'Ready',
];
const MIN_DISPLAY = 1600; // ms — brief, just enough to feel intentional
const LOGO = '/assets/cs-logo.png';

export default function SplashScreen({ ready, onDone }) {
  const [msg, setMsg] = useState(0);
  const [exiting, setExiting] = useState(false);
  const start = useRef(Date.now());
  const finalized = useRef(false);

  // Time-based message progression (0 → 2) until the app signals ready.
  useEffect(() => {
    const t1 = setTimeout(() => setMsg((m) => (m < 1 ? 1 : m)), 1000);
    const t2 = setTimeout(() => setMsg((m) => (m < 2 ? 2 : m)), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // When the app is ready, hold the minimum, show "Ready", then fade out.
  useEffect(() => {
    if (!ready || finalized.current) return;
    finalized.current = true;
    const elapsed = Date.now() - start.current;
    const wait = Math.max(0, MIN_DISPLAY - elapsed);
    const toReady = setTimeout(() => setMsg(3), wait);
    const toExit = setTimeout(() => setExiting(true), wait + 350);
    const toDone = setTimeout(() => onDone && onDone(), wait + 700);
    return () => { clearTimeout(toReady); clearTimeout(toExit); clearTimeout(toDone); };
  }, [ready, onDone]);

  const isReady = msg === 3;

  return (
    <div className="cs-splash" data-exit={exiting ? 'true' : 'false'} role="status" aria-live="polite">
      <div className="cs-stage">
        <svg className="cs-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="cs-track" cx="50" cy="50" r="47" fill="none" strokeWidth="2" />
          <circle className="cs-arc" cx="50" cy="50" r="47" fill="none" stroke="#f0952f" strokeWidth="3" strokeLinecap="round" pathLength="100" />
        </svg>
        <img className="cs-logo" src={LOGO} alt="CSAS" />
      </div>
      <div className="cs-msg" key={msg} data-ready={isReady ? 'true' : 'false'}>{MESSAGES[msg]}</div>
    </div>
  );
}
