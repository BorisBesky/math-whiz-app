const URLS = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/about/best-math-app-3rd-grade", changefreq: "monthly", priority: "0.8" },
  { path: "/about/best-math-app-4th-grade", changefreq: "monthly", priority: "0.8" },
  { path: "/about/math-practice-app-3rd-grade", changefreq: "monthly", priority: "0.8" },
  { path: "/about/teacher-dashboard", changefreq: "monthly", priority: "0.8" },
  { path: "/about/standards-aligned-math-app", changefreq: "monthly", priority: "0.8" },
  { path: "/about/multiplication-practice-3rd-grade", changefreq: "monthly", priority: "0.8" },
  { path: "/about/fractions-app-for-kids", changefreq: "monthly", priority: "0.8" },
  { path: "/about/fun-math-app-elementary", changefreq: "monthly", priority: "0.8" },
  { path: "/about/free-math-practice-app", changefreq: "monthly", priority: "0.7" },
  { path: "/about/adaptive-math-app", changefreq: "monthly", priority: "0.7" },
  { path: "/about/common-core-math-app", changefreq: "monthly", priority: "0.7" },
  { path: "/about/math-app-with-rewards", changefreq: "monthly", priority: "0.7" },
  { path: "/about/division-practice-3rd-grade", changefreq: "monthly", priority: "0.7" },
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
