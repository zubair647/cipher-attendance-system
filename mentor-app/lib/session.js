import { cookies } from 'next/headers';

const COOKIE = 'cipher_mentor_session';

/** Returns the logged-in mentor object { mentor_id, name, email, university } or null. */
export function getSession() {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function setSessionCookie(mentor) {
  const value = Buffer.from(JSON.stringify(mentor)).toString('base64');
  cookies().set(COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, '', { path: '/', maxAge: 0 });
}

export { COOKIE };
