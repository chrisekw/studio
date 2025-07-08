// This file instructs search engine crawlers which pages to index.
export async function GET() {
    // IMPORTANT: Replace this with your app's actual production domain.
    const baseUrl = "https://your-domain.com"; 

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

Sitemap: ${baseUrl}/sitemap.xml
`.trim();

    return new Response(robots, {
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}
