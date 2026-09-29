import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const COOKIE = 'cipher_mentor_session';

// A valid session cookie is base64-encoded JSON with a mentor_id.
function isValidSession(value) {
  if (!value) return false;
  try {
    const json = JSON.parse(atob(value));
    return !!(json && json.mentor_id);
  } catch {
    return false;
  }
}

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }
  const valid = isValidSession(req.cookies.get(COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!valid && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 }); // clear any stale/invalid cookie
    return res;
  }
  if (valid && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
};
