'use client';
import { useEffect, useState } from 'react';
import { Bell, Download, X } from 'lucide-react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

const LS_NOTIF_DISMISSED = 'cipher_notif_dismissed';
const LS_IOS_DISMISSED = 'cipher_ios_hint_dismissed';

export default function PwaManager() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showNotifCard, setShowNotifCard] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifDone, setNotifDone] = useState(false);

  useEffect(() => {
    // Register the service worker (needed for install + push). Best-effort.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Android/Chrome: capture the install prompt.
    const onBip = (e) => { e.preventDefault(); setInstallEvent(e); };
    window.addEventListener('beforeinstallprompt', onBip);

    // iOS Safari: no programmatic install — show a one-line hint if not installed.
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    let iosDismissed = false;
    try { iosDismissed = localStorage.getItem(LS_IOS_DISMISSED) === '1'; } catch {}
    if (isIos && !isStandalone && !iosDismissed) setShowIosHint(true);

    // Notifications: ask once, only if supported and not yet decided/dismissed.
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    let notifDismissed = false;
    try { notifDismissed = localStorage.getItem(LS_NOTIF_DISMISSED) === '1'; } catch {}
    if (supported && Notification.permission === 'default' && !notifDismissed) {
      setShowNotifCard(true);
    } else if (supported && Notification.permission === 'granted') {
      // Already granted — make sure a subscription exists (e.g. after reinstall).
      subscribe().catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  async function subscribe() {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub }),
    });
  }

  async function enableNotifications() {
    setNotifBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        await subscribe();
        setNotifDone(true);
        setTimeout(() => setShowNotifCard(false), 1800);
      } else {
        // Denied — respect it, don't ask again.
        try { localStorage.setItem(LS_NOTIF_DISMISSED, '1'); } catch {}
        setShowNotifCard(false);
      }
    } catch {
      setShowNotifCard(false);
    } finally {
      setNotifBusy(false);
    }
  }

  function dismissNotif() {
    try { localStorage.setItem(LS_NOTIF_DISMISSED, '1'); } catch {}
    setShowNotifCard(false);
  }
  function dismissIos() {
    try { localStorage.setItem(LS_IOS_DISMISSED, '1'); } catch {}
    setShowIosHint(false);
  }

  async function doInstall() {
    if (!installEvent) return;
    installEvent.prompt();
    try { await installEvent.userChoice; } catch {}
    setInstallEvent(null);
  }

  if (!showNotifCard && !showIosHint && !installEvent) return null;

  return (
    <div className="flex flex-col gap-2.5 mb-1">
      {showNotifCard && (
        <div className="rounded-2xl border border-accent-tint bg-[#FFF7EF] p-3.5 flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-accent-tint text-accent-ink flex items-center justify-center shrink-0">
            <Bell size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-text-primary">
              {notifDone ? 'Reminders on 🎉' : 'Turn on check-in reminders?'}
            </div>
            {!notifDone && (
              <div className="text-[13px] text-text-secondary mt-0.5">
                We’ll nudge you if you forget to check in or out.
              </div>
            )}
            {!notifDone && (
              <div className="flex gap-2 mt-2.5">
                <button onClick={enableNotifications} disabled={notifBusy}
                  className="h-9 px-3.5 rounded-xl bg-accent text-white text-[13px] font-semibold disabled:opacity-60">
                  {notifBusy ? 'Enabling…' : 'Enable'}
                </button>
                <button onClick={dismissNotif} className="h-9 px-3 rounded-xl text-[13px] text-text-secondary">Not now</button>
              </div>
            )}
          </div>
          {!notifDone && <button onClick={dismissNotif} className="text-text-tertiary"><X size={16} /></button>}
        </div>
      )}

      {installEvent && (
        <button onClick={doInstall}
          className="rounded-2xl border border-border bg-surface p-3.5 flex items-center gap-3 text-left">
          <span className="w-8 h-8 rounded-full bg-canvas text-text-primary flex items-center justify-center shrink-0">
            <Download size={16} />
          </span>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">Install the app</div>
            <div className="text-[13px] text-text-secondary mt-0.5">Add Cipher to your home screen for one-tap check-in.</div>
          </div>
        </button>
      )}

      {showIosHint && (
        <div className="rounded-2xl border border-border bg-surface p-3.5 flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-canvas text-text-primary flex items-center justify-center shrink-0">
            <Download size={16} />
          </span>
          <div className="flex-1 text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">Install this app:</span> tap the Share button, then “Add to Home Screen.”
          </div>
          <button onClick={dismissIos} className="text-text-tertiary"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}
