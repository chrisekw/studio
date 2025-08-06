// This file instructs search engine crawlers which pages to index.
import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = "https://opilot.vercel.app"; 

    const robots = `
User-Agent: *
Allow: /
Allow: /pricing

# Disallow authenticated routes from being indexed
Disallow: /dashboard/
Disallow: /settings/
Disallow: /saved-leads/
Disallow: /referrals/
Disallow: /payment/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml
`.trim();

    return new NextResponse(robots, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
}
