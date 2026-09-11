import { cookies } from 'next/headers';

const COOKIE = 'cipher_mentor_session';

export function getSessionMentorId() {
  return cookies().get(COOKIE)?.value || null;
}

export function setSessionCookie(mentorId) {
  cookies().set(COOKIE, mentorId, {
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
