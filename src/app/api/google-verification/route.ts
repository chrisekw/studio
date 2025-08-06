import { NextResponse } from 'next/server';

export function GET() {
  const verificationContent = 'google-site-verification: googleb3d21e9511a05b5b.html';
  return new NextResponse(verificationContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
