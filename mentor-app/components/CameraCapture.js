'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CameraCapture({ mode, universityCode }) {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState('live'); // live | preview | submitting | denied
  const [photo, setPhoto] = useState(null);
  const [capturedAt, setCapturedAt] = useState(null);
  const [facingMode, setFacingMode] = useState('user');
  const [error, setError] = useState('');

  const endpoint = mode === 'checkin' ? '/api/checkin' : '/api/checkout';
  const title = mode === 'checkin' ? 'Check-in photo' : 'Check-out photo';
  const confirmLabel = mode === 'checkin' ? 'Confirm check-in' : 'Confirm check-out';
  const bannerKey = mode === 'checkin' ? 'checkin' : 'checkout';

  useEffect(() => {
    if (phase !== 'live') return;
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        if (!cancelled) setPhase('denied');
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [phase, facingMode]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // mirror, like a selfie preview
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL('image/jpeg', 0.85));
    setCapturedAt(new Date());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setPhase('preview');
  }

  function retake() {
    setPhoto(null);
    setCapturedAt(null);
    setPhase('live');
  }

  async function confirm() {
    setPhase('submitting');
    setError('');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setPhase('preview');
        return;
      }
      router.push(`/?banner=${bannerKey}`);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
      setPhase('preview');
    }
  }

  if (phase === 'denied') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-5">
        <div className="w-full max-w-[400px] bg-surface rounded-2xl shadow-card p-6">
          <div className="w-11 h-11 rounded-full bg-flagged-bg flex items-center justify-center text-flagged-fg text-[20px] font-bold mb-4">!</div>
          <div className="text-[20px] font-bold tracking-[-0.015em] mb-2">Camera access is blocked</div>
          <p className="text-[15px] leading-[1.55] text-text-secondary mb-4">
            This browser needs permission to use your camera for a {mode === 'checkin' ? 'check-in' : 'check-out'} photo.
          </p>
          <div className="bg-canvas rounded-xl p-3.5 text-[13px] font-mono text-text-secondary mb-5">
            Settings → Site settings → Camera → Allow
          </div>
          <button onClick={() => setPhase('live')} className="w-full h-[58px] rounded-2xl bg-accent text-white font-semibold text-[16px] shadow-button-orange mb-3">
            Try again
          </button>
          <Link href="/" className="block text-center w-full h-[54px] leading-[54px] rounded-2xl border border-border font-medium text-[15px]">
            Ask ops to record it manually
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'preview') {
    return (
      <div className="min-h-screen bg-canvas flex flex-col max-w-[480px] mx-auto px-5 pt-6 pb-8">
        <div className="text-center text-[16px] font-semibold mb-4">Confirm {mode === 'checkin' ? 'check-in' : 'check-out'}</div>
        <div className="relative rounded-3xl overflow-hidden bg-camera-bg mb-4" style={{ aspectRatio: '3/4' }}>
          <img src={photo} alt="Captured" className="w-full h-full object-cover" />
          <div className="absolute left-3 bottom-3 bg-black/45 text-white text-[12px] font-mono px-2.5 py-1 rounded-full">
            {fmtMeta(capturedAt, universityCode)}
          </div>
        </div>
        <div className="bg-surface rounded-2xl shadow-card p-4 mb-5">
          <Row label="Captured at" value={fmtTime(capturedAt)} />
          <Row label="Date" value={fmtDate(capturedAt)} />
          <Row label="University" value={universityCode} last />
        </div>
        {error && <div className="text-[13px] text-flagged-fg mb-3">{error}</div>}
        <button
          onClick={confirm}
          disabled={phase === 'submitting'}
          className="w-full h-[60px] rounded-2xl bg-accent text-white font-semibold text-[17px] shadow-button-orange mb-3 disabled:opacity-60"
        >
          {phase === 'submitting' ? 'Saving…' : confirmLabel}
        </button>
        <button onClick={retake} className="w-full h-14 rounded-2xl border border-border bg-white font-medium text-[15px]">
          Retake photo
        </button>
      </div>
    );
  }

  // live
  return (
    <div className="min-h-screen bg-camera-bg flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <Link href="/" className="text-white text-[16px] font-medium">Cancel</Link>
        <div className="text-white text-[16px] font-semibold">{title}</div>
        <div className="w-[52px]" />
      </div>
      <div className="flex-1 mx-4 mb-4 rounded-3xl overflow-hidden relative bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        <div
          className="absolute border-2 border-dashed rounded-[120px] pointer-events-none"
          style={{ width: 210, height: 280, left: '50%', top: '46%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(255,255,255,.4)' }}
        />
        <div className="absolute left-3 bottom-3 bg-black/45 text-white text-[12px] font-mono px-2.5 py-1 rounded-full">
          {fmtMeta(new Date(), universityCode)}
        </div>
      </div>
      <div className="flex flex-col items-center pb-8 px-4">
        <div className="text-white/70 text-[14px] mb-4 text-center">Center your face in the frame, then tap to capture.</div>
        <button onClick={capture} className="w-[82px] h-[82px] rounded-full flex items-center justify-center" style={{ boxShadow: '0 0 0 4px rgba(255,255,255,.35)' }}>
          <span className="w-16 h-16 rounded-full bg-accent" style={{ boxShadow: '0 0 24px rgba(242,135,31,.5)' }} />
        </button>
        <button onClick={() => setFacingMode((f) => (f === 'user' ? 'environment' : 'user'))} className="text-white/80 text-[14px] mt-4">
          Switch camera
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

function fmtTime(d) { return d ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase() : ''; }
function fmtDate(d) { return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }
function fmtMeta(d, code) { return `${fmtDate(d)} · ${fmtTime(d)} · ${code || ''}`; }
