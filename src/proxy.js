import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === '/arcade') {
    const url = request.nextUrl.clone();
    url.pathname = '/arcade/';
    return NextResponse.redirect(url, 308);
  }

  if (pathname === '/arcade/') {
    const url = request.nextUrl.clone();
    url.pathname = '/arcade/index.html';
    return NextResponse.rewrite(url);
  }

  const projSlash = /^\/arcade\/projects\/([^/]+)\/$/.exec(pathname);
  if (projSlash) {
    const url = request.nextUrl.clone();
    url.pathname = `/arcade/projects/${projSlash[1]}/index.html`;
    return NextResponse.rewrite(url);
  }

  const projNoSlash = /^\/arcade\/projects\/([^/.]+)$/.exec(pathname);
  if (projNoSlash) {
    const url = request.nextUrl.clone();
    url.pathname = `/arcade/projects/${projNoSlash[1]}/index.html`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/arcade', '/arcade/', '/arcade/projects/:path*'],
};
