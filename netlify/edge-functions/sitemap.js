const URLS = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/login", changefreq: "monthly", priority: "0.7" },
];

export default async (request) => {
  const host = request.headers.get("host");
  const origin = `https://${host}`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${URLS.map(
    (u) => `  <url>
    <loc>${origin}${u.path}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  ).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "content-type": "application/xml" },
  });
};
