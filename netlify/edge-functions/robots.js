export default async () => {
  const body = `User-agent: *
Allow: /
Allow: /about/
Allow: /login
Disallow: /app/
Disallow: /admin
Disallow: /teacher
Disallow: /portal

Sitemap: https://mathwhizapp.kids/sitemap.xml`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain",
      "cache-control": "public, max-age=86400",
    },
  });
};

export const config = { path: "/robots.txt" };
