// This file generates a sitemap to help search engines understand your site structure.
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    // IMPORTANT: Replace this with your app's actual production domain.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com";

    // Static pages
    const staticRoutes = [
      { url: '/', priority: 1.0 },
      { url: '/pricing', priority: 0.8 },
      { url: '/login', priority: 0.5 },
      { url: '/register', priority: 0.5 },
    ];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(({ url, priority }) => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>
  `.trim()).join('')}
</urlset>
`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
}
