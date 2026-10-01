'use client';
import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'Waking up the database…',
  'Loading your details…',
  'We’re almost done…',
  'Ready',
];
const MIN_DISPLAY = 2200; // ms — let the logo build finish
const LOGO = '/assets/cs-logo.png';

export default function SplashScreen({ ready, onDone }) {
  const [msg, setMsg] = useState(0);
  const [exiting, setExiting] = useState(false);
  const start = useRef(Date.now());
  const finalized = useRef(false);

  // Time-based message progression (1 → 3) until the app signals ready.
  useEffect(() => {
    const t1 = setTimeout(() => setMsg((m) => (m < 1 ? 1 : m)), 1400);
    const t2 = setTimeout(() => setMsg((m) => (m < 2 ? 2 : m)), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // When the app is ready, hold the minimum, show "Ready", then fade out.
  useEffect(() => {
    if (!ready || finalized.current) return;
    finalized.current = true;
    const elapsed = Date.now() - start.current;
    const wait = Math.max(0, MIN_DISPLAY - elapsed);
    const toReady = setTimeout(() => setMsg(3), wait);
    const toExit = setTimeout(() => setExiting(true), wait + 400);
    const toDone = setTimeout(() => onDone && onDone(), wait + 800);
    return () => { clearTimeout(toReady); clearTimeout(toExit); clearTimeout(toDone); };
  }, [ready, onDone]);

  const isReady = msg === 3;

  return (
    <div className="cs-splash" data-exit={exiting ? 'true' : 'false'} role="status" aria-live="polite">
      <link rel="preload" as="image" href={LOGO} />
      <div className="cs-stage">
        <svg className="cs-ring" viewBox="0 0 512 512" aria-hidden="true">
          <circle className="cs-track" cx="256" cy="256" r="252" fill="none" strokeWidth="4" />
          <g className="cs-arc-g">
            <circle className="cs-arc" cx="256" cy="256" r="252" fill="none" stroke="#f0952f" strokeWidth="6" strokeLinecap="round" pathLength="100" />
          </g>
        </svg>
        <div className="cs-disc" />
        <img className="cs-c" src={LOGO} alt="CipherSchools" />
        <img className="cs-seg cs-seg-top" src={LOGO} alt="" aria-hidden="true" />
        <img className="cs-seg cs-seg-bot" src={LOGO} alt="" aria-hidden="true" />
      </div>
      <div className="cs-status">
        <div className="cs-rule"><div className="cs-rule-fill" /></div>
        <div className="cs-msg" key={msg} data-ready={isReady ? 'true' : 'false'}>{MESSAGES[msg]}</div>
      </div>
    </div>
  );
}
