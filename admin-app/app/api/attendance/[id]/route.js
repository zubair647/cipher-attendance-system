import { NextResponse } from 'next/server';
import { callBackend } from '@cipher/shared';
import { getAdmin } from '../../../../lib/session';

export async function PATCH(req, { params }) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });

  const { checkInTime, checkOutTime, note } = await req.json();

  // Basic sanity: if both times present, check-out must be after check-in.
  if (checkInTime && checkOutTime) {
    const [ih, im] = checkInTime.split(':').map(Number);
    const [oh, om] = checkOutTime.split(':').map(Number);
    const mins = (oh * 60 + om) - (ih * 60 + im);
    if (mins <= 0) return NextResponse.json({ error: 'Check-out must be after check-in.' }, { status: 400 });
    if (mins > 16 * 60) return NextResponse.json({ error: 'That gap is longer than 16 hours — double-check the times.' }, { status: 400 });
  }

  const payload = { record_id: params.id };
  if (checkInTime) payload.check_in_time = checkInTime;
  if (checkOutTime) payload.check_out_time = checkOutTime;
  if (note) payload.admin_remark = `${note} (by ${admin.name || admin.email})`;

  const r = await callBackend('editAttendanceRecord', payload);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
