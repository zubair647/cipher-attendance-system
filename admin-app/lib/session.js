import { cookies } from 'next/headers';

const COOKIE = 'cipher_admin_session';

/** Returns the logged-in admin { email, name } or null. */
export function getAdmin() {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function setAdminCookie(admin) {
  const value = Buffer.from(JSON.stringify(admin)).toString('base64');
  cookies().set(COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAdminCookie() {
  cookies().set(COOKIE, '', { path: '/', maxAge: 0 });
}

export { COOKIE };
