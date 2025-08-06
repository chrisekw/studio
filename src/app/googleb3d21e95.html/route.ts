import { NextResponse } from 'next/server';

export function GET() {
  return new NextResponse('google-site-verification: googleb3d21e95.html', {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
