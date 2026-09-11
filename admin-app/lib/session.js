import { cookies } from 'next/headers';

const COOKIE = 'cipher_admin_session';

export function getSessionAdminId() {
  return cookies().get(COOKIE)?.value || null;
}

export function setSessionCookie(adminId) {
  cookies().set(COOKIE, adminId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie() {
  cookies().set(COOKIE, '', { path: '/', maxAge: 0 });
}
