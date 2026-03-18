export default async (request) => {
  const host = request.headers.get("host") || "mathwhizapp.kids";

  const body = `User-agent: *
Allow: /
Allow: /about/
Allow: /login
Disallow: /app/
Disallow: /admin
Disallow: /teacher
Disallow: /portal

Sitemap: https://${host}/sitemap.xml`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=86400",
    },
  });
};

export const config = { path: "/robots.txt" };
