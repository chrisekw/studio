
// This file instructs search engine crawlers which pages to index.
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // IMPORTANT: Replace this with your app's actual production domain.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"; 

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

Sitemap: ${baseUrl}/api/sitemap
`.trim();

    res.setHeader('Content-Type', 'text/plain');
    res.send(robots);
}
