import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getAdmin } from '../../../../lib/session';

// Photos live privately in Drive; the backend returns them as base64. We fetch
// on demand (only when the admin opens a preview) and hand back a data URL.
export async function GET(req, { params }) {
  if (!getAdmin()) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const r = await callBackend('getPhoto', { photo_id: params.id });
  if (r.error || !r.base64) return NextResponse.json({ error: r.error || 'Photo not found.' }, { status: 404 });
  return NextResponse.json({ dataUrl: `data:${r.mimeType || 'image/jpeg'};base64,${r.base64}` });
}
