import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A lightweight "keep-warm" endpoint. Pinging it on a schedule keeps both this
// Vercel function and the Google Apps Script backend from going cold, so real
// mentor loads during working hours are fast instead of hitting a cold start.
export async function GET() {
  const started = Date.now();
  // getMentors is a small, real action — hitting it wakes the backend.
  const r = await callBackend('getMentors', {});
  return NextResponse.json({ ok: !r.error, ms: Date.now() - started });
}
