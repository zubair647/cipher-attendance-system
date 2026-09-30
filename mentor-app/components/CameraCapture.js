'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addCapture, removeCapture } from '../lib/outbox';

const IST = 'Asia/Kolkata';
function istParts(d) {
  return {
    date: d.toLocaleDateString('en-CA', { timeZone: IST }),
    time: d.toLocaleTimeString('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

export default function CameraCapture({ mode, universityCode }) {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('live'); // live | preview | submitting | saved-offline | denied
  const [photo, setPhoto] = useState(null);
  const [capturedAt, setCapturedAt] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // back camera by default
  const [savedItem, setSavedItem] = useState(null);
  const [error, setError] = useState('');

  const endpoint = mode === 'checkin' ? '/api/checkin' : '/api/checkout';
  const title = mode === 'checkin' ? 'Check-in photo' : 'Check-out photo';
  const confirmLabel = mode === 'checkin' ? 'Confirm check-in' : 'Confirm check-out';
  const bannerKey = mode === 'checkin' ? 'checkin' : 'checkout';

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (phase !== 'live') return;
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setPhase('denied');
      }
    }
    start();
    return () => { cancelled = true; stopStream(); };
  }, [phase, facingMode]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    // Compress: cap the longest side at 1280px and use JPEG quality 0.7, so the
    // upload is small and fast even on mobile data.
    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
    const cw = Math.round(video.videoWidth * scale);
    const ch = Math.round(video.videoHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') { ctx.translate(cw, 0); ctx.scale(-1, 1); } // mirror selfies only
    ctx.drawImage(video, 0, 0, cw, ch);
    setPhoto(canvas.toDataURL('image/jpeg', 0.7));
    setCapturedAt(new Date());
    stopStream();
    setPhase('preview');
  }

  function retakePhoto() {
    setPhoto(null); setCapturedAt(null); setError(''); setPhase('live');
  }

  async function attemptUpload(item) {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: item.photo, capturedAt: { date: item.date, time: item.time } }),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (res.ok) return { ok: true };
      let data = {}; try { data = await res.json(); } catch {}
      return { ok: false, status: res.status, error: data.error };
    } catch {
      clearTimeout(to);
      return { ok: false, network: true };
    }
  }

  // Save to the phone first, then try to upload.
  async function confirm() {
    const cap = capturedAt || new Date();
    const parts = istParts(cap);
    const item = { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, type: mode, photo, date: parts.date, time: parts.time, createdAt: Date.now() };
    try { await addCapture(item); } catch {} // saved on device before we even try the network
    await uploadFlow(item);
  }

  async function uploadFlow(item) {
    setPhase('submitting'); setError('');
    const r = await attemptUpload(item);
    if (r.ok) {
      await removeCapture(item.id).catch(() => {});
      router.push(`/?banner=${bannerKey}`); router.refresh();
      return;
    }
    // Already recorded / can't be completed → nothing to retry; go home.
    if (r.status === 409 || /already|duplicate|no check-in/i.test(r.error || '')) {
      await removeCapture(item.id).catch(() => {});
      router.push('/'); router.refresh();
      return;
    }
    // Network or server hiccup → it's safe on the phone; offer retry.
    setSavedItem(item);
    setPhase('saved-offline');
  }

  // ── DENIED ──
  if (phase === 'denied') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-5">
        <div className="w-full max-w-[400px] bg-surface rounded-2xl shadow-card p-6">
          <div className="w-11 h-11 rounded-full bg-flagged-bg flex items-center justify-center text-flagged-fg text-[20px] font-bold mb-4">!</div>
          <div className="text-[20px] font-bold tracking-[-0.015em] mb-2">Camera access is blocked</div>
          <p className="text-[15px] leading-[1.55] text-text-secondary mb-4">This app needs the camera to take your {mode === 'checkin' ? 'check-in' : 'check-out'} photo.</p>
          <div className="bg-canvas rounded-xl p-3.5 text-[13px] font-mono text-text-secondary mb-5">Settings → Site settings → Camera → Allow</div>
          <button onClick={() => setPhase('live')} className="w-full h-[58px] rounded-2xl bg-accent text-white font-semibold text-[16px] shadow-button-orange mb-3">Try again</button>
          <Link href="/" className="block text-center w-full h-[54px] leading-[54px] rounded-2xl border border-border font-medium text-[15px]">Ask ops to record it manually</Link>
        </div>
      </div>
    );
  }

  // ── SAVED OFFLINE (retry popup) ──
  if (phase === 'saved-offline') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-5">
        <div className="w-full max-w-[400px] bg-surface rounded-2xl shadow-card p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-leave-bg flex items-center justify-center text-leave-fg mx-auto mb-4 text-[22px]">⟳</div>
          <div className="text-[20px] font-bold tracking-[-0.015em] mb-2">Couldn’t upload yet</div>
          <p className="text-[15px] leading-[1.55] text-text-secondary mb-5">
            No problem — your photo is <b>saved on your phone</b> and will upload automatically when you’re back online. You can also try again now.
          </p>
          <button onClick={() => uploadFlow(savedItem)} className="w-full h-[56px] rounded-2xl bg-accent text-white font-semibold text-[16px] shadow-button-orange mb-3">Try again now</button>
          <button onClick={() => { router.push('/'); router.refresh(); }} className="w-full h-[52px] rounded-2xl border border-border font-medium text-[15px]">Go to home</button>
        </div>
      </div>
    );
  }

  // ── PREVIEW / SUBMITTING ──
  if (phase === 'preview' || phase === 'submitting') {
    const busy = phase === 'submitting';
    return (
      <div className="min-h-screen bg-canvas flex flex-col max-w-[480px] mx-auto px-5 pt-6 pb-8">
        <div className="text-center text-[16px] font-semibold mb-4">Confirm {mode === 'checkin' ? 'check-in' : 'check-out'}</div>
        <div className="relative rounded-3xl overflow-hidden bg-camera-bg mb-4" style={{ aspectRatio: '3/4' }}>
          <img src={photo} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute left-3 bottom-3 bg-black/45 text-white text-[12px] font-mono px-2.5 py-1 rounded-full">{fmtMeta(capturedAt, universityCode)}</div>
        </div>
        <div className="bg-surface rounded-2xl shadow-card p-4 mb-5">
          <Row label="Captured at" value={fmtTime(capturedAt)} />
          <Row label="Date" value={fmtDate(capturedAt)} />
          <Row label="University" value={universityCode} last />
        </div>
        {error && <div className="text-[13px] text-flagged-fg mb-3">{error}</div>}
        <button onClick={confirm} disabled={busy} className="w-full h-[60px] rounded-2xl bg-accent text-white font-semibold text-[17px] shadow-button-orange mb-3 disabled:opacity-70">
          {busy ? 'Uploading…' : confirmLabel}
        </button>
        {!busy && <button onClick={retakePhoto} className="w-full h-14 rounded-2xl border border-border bg-white font-medium text-[15px]">Retake photo</button>}
        {busy && <div className="text-center text-[13px] text-text-secondary">Saved on your phone — sending to the server…</div>}
      </div>
    );
  }

  // ── LIVE ──
  return (
    <div className="min-h-screen bg-camera-bg flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <Link href="/" className="text-white text-[16px] font-medium">Cancel</Link>
        <div className="text-white text-[16px] font-semibold">{title}</div>
        <div className="w-[52px]" />
      </div>
      <div className="flex-1 mx-4 mb-4 rounded-3xl overflow-hidden relative bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }} />
        {/* Framing guide — a rounded rectangle, since mentors photograph the attendance board */}
        <div className="absolute border-2 border-dashed rounded-2xl pointer-events-none"
          style={{ inset: '14% 10%', borderColor: 'rgba(255,255,255,.45)' }} />
        <div className="absolute left-3 bottom-3 bg-black/45 text-white text-[12px] font-mono px-2.5 py-1 rounded-full">{fmtMeta(new Date(), universityCode)}</div>
      </div>
      <div className="flex flex-col items-center pb-8 px-4">
        <div className="text-white/70 text-[14px] mb-4 text-center">Line up the attendance board in the frame, then tap to capture.</div>
        <button onClick={capture} className="w-[82px] h-[82px] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 4px rgba(255,255,255,.35)' }}>
          <span className="w-16 h-16 rounded-full bg-accent" style={{ boxShadow: '0 0 24px rgba(242,135,31,.5)' }} />
        </button>
        <button onClick={() => setFacingMode((f) => (f === 'user' ? 'environment' : 'user'))} className="text-white/80 text-[14px] mt-4">
          Switch camera ({facingMode === 'user' ? 'front' : 'back'})
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, last }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${last ? '' : 'border-b border-border-soft'}`}>
      <span className="text-[15px] text-text-secondary">{label}</span>
      <span className="text-[15px] font-semibold">{value}</span>
    </div>
  );
}
function fmtTime(d) { return d ? d.toLocaleTimeString('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : ''; }
function fmtDate(d) { return d ? d.toLocaleDateString('en-IN', { timeZone: IST, day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
function fmtMeta(d, code) { return `${fmtDate(d)} · ${fmtTime(d)} · ${code || ''}`; }
