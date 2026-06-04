const SITE_URL = "https://mathwhizapp.kids";

const ABOUT_OVERVIEW = {
  title: "Math Whiz - Adaptive Math Practice for 3rd & 4th Graders",
  description:
    "Free adaptive math practice for 3rd and 4th graders. Teachers create classes, track progress, and add custom content while students earn rewards.",
};

const SEO_PAGES = {
  "best-math-app-3rd-grade": {
    title: "Best Math App for 3rd Graders - Free & Adaptive | Math Whiz",
    description:
      "Looking for the best math app for 3rd graders? Math Whiz offers adaptive practice in multiplication, division, fractions, and geometry aligned to Common Core standards.",
  },
  "best-math-app-4th-grade": {
    title: "Best Math App for 4th Graders - Free & Adaptive | Math Whiz",
    description:
      "Find the best math app for 4th graders. Math Whiz covers multi-digit multiplication, fractions, geometry, and measurement with adaptive difficulty and teacher dashboards.",
  },
  "math-practice-app-3rd-grade": {
    title: "Math Practice App for 3rd Grade - Daily Practice That Works | Math Whiz",
    description:
      "Help your 3rd grader build math fluency with daily adaptive practice. Math Whiz covers multiplication, division, fractions, and more with progress tracking.",
  },
  "teacher-dashboard": {
    title: "Math App with Teacher Dashboard - Class Management & Analytics | Math Whiz",
    description:
      "Manage your math classroom with real-time analytics, AI focus recommendations, per-student assignments, custom content, and question generation.",
  },
  "ai-student-performance-insights": {
    title: "AI Student Performance Insights for Math Teachers | Math Whiz",
    description:
      "See AI-generated focus recommendations based on student math performance. Review weak subtopics, apply focus areas, and plan interventions faster.",
  },
  "standards-aligned-math-app": {
    title: "Standards-Aligned Math App for Elementary - Common Core | Math Whiz",
    description:
      "Every question in Math Whiz maps to Common Core standards for 3rd and 4th grade math. See exactly which standards your students are practicing.",
  },
  "multiplication-practice-3rd-grade": {
    title: "Multiplication Practice App for 3rd Grade - Build Fluency | Math Whiz",
    description:
      "Help your 3rd grader master multiplication with adaptive practice, arrays, word problems, and visual tools. Free multiplication app aligned to Common Core.",
  },
  "fractions-app-for-kids": {
    title: "Fractions App for Kids - Visual & Adaptive Practice | Math Whiz",
    description:
      "Make fractions click for your child. Math Whiz uses visual models, adaptive difficulty, and step-by-step explanations to build real fraction understanding.",
  },
  "fun-math-app-elementary": {
    title: "Fun Math App for Elementary School - Rewards & Drawing | Math Whiz",
    description:
      "Math practice that kids actually enjoy. Earn coins, unlock rewards, draw your work, and level up with adaptive challenges. Free for elementary students.",
  },
  "free-math-practice-app": {
    title: "Free Math Practice App for Elementary - No Ads, No Limits | Math Whiz",
    description:
      "Math Whiz is 100% free with no ads, no paywalls, and no limits. Full access to adaptive practice, teacher tools, and all topics for 3rd and 4th graders.",
  },
  "adaptive-math-app": {
    title: "Adaptive Math App for Kids - Personalized Practice | Math Whiz",
    description:
      "Math Whiz adapts to your child's level in real time. Questions get harder as they improve and easier when they struggle.",
  },
  "common-core-math-app": {
    title: "Common Core Math App for 3rd & 4th Grade | Math Whiz",
    description:
      "Every Math Whiz question maps to specific Common Core standards. See topic-by-standard breakdowns for 3rd and 4th grade math.",
  },
  "math-app-with-rewards": {
    title: "Math App with Rewards for Kids - Coins & Store | Math Whiz",
    description:
      "Kids earn coins for correct answers and spend them in the store. Math Whiz uses rewards to keep students motivated without pay-to-win mechanics.",
  },
  "division-practice-3rd-grade": {
    title: "Division Practice App for 3rd Grade - Master the Basics | Math Whiz",
    description:
      "Build division fluency for 3rd graders with adaptive practice, word problems, and visual tools. Connects division to multiplication for deeper understanding.",
  },
};

function escapeAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}</head>`);
}

function pageData(pathname) {
  if (pathname === "/about") {
    return { ...ABOUT_OVERVIEW, canonical: `${SITE_URL}/about` };
  }

  const match = pathname.match(/^\/about\/([^/]+)\/?$/);
  if (!match) return null;

  const page = SEO_PAGES[match[1]];
  if (!page) return null;

  return { ...page, canonical: `${SITE_URL}/about/${match[1]}` };
}

export default async (request, context) => {
  if (request.method !== "GET") return context.next();

  const url = new URL(request.url);
  const data = pageData(url.pathname);
  if (!data) return context.next();

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();
  const title = escapeAttribute(data.title);
  const description = escapeAttribute(data.description);
  const canonical = escapeAttribute(data.canonical);

  html = replaceTag(html, /<title>.*?<\/title>/i, `<title>${title}</title>`);
  html = replaceTag(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`,
  );
  html = replaceTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${description}" />`,
  );

  const headers = new Headers(response.headers);
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
