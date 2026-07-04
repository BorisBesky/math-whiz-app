const SITE_URL = "https://mathwhizapp.kids";
const SITE_NAME = "Math Whiz";

const ABOUT_OVERVIEW = {
  title: "Math Whiz - Adaptive Math Practice for 3rd & 4th Graders",
  description:
    "Free adaptive math practice for 3rd and 4th graders. Teachers create classes, monitor progress, review question history, and add custom content while students earn rewards.",
  keyword: "adaptive math practice for 3rd and 4th graders",
  type: "WebApplication",
};

const SEO_PAGES = {
  "best-math-app-3rd-grade": {
    title: "Best Math App for 3rd Graders - Free & Adaptive | Math Whiz",
    description:
      "Looking for the best math app for 3rd graders? Math Whiz offers adaptive practice in multiplication, division, fractions, and geometry aligned to Common Core standards.",
    keyword: "best math app for 3rd graders",
  },
  "best-math-app-4th-grade": {
    title: "Best Math App for 4th Graders - Free & Adaptive | Math Whiz",
    description:
      "Find the best math app for 4th graders. Math Whiz covers multi-digit multiplication, fractions, geometry, and measurement with adaptive difficulty and teacher dashboards.",
    keyword: "best math app for 4th graders",
  },
  "math-practice-app-3rd-grade": {
    title: "Math Practice App for 3rd Grade - Daily Practice That Works | Math Whiz",
    description:
      "Help your 3rd grader build math fluency with daily adaptive practice. Math Whiz covers multiplication, division, fractions, and more with progress tracking.",
    keyword: "math practice app 3rd grade",
  },
  "teacher-dashboard": {
    title: "Math App with Teacher Dashboard - Class Management & Analytics | Math Whiz",
    description:
      "Manage math classes with live analytics, multi-class rosters, question history, AI focus recommendations, custom content, and question generation.",
    keyword: "math app with teacher dashboard",
  },
  "student-math-progress-monitoring": {
    title: "Student Math Progress Monitoring for Teachers | Math Whiz",
    description:
      "Track student math progress with question history, date filters, multi-class rosters, and AI-supported intervention planning for 3rd and 4th grade.",
    keyword: "student math progress monitoring",
  },
  "ai-student-performance-insights": {
    title: "AI Student Performance Insights for Math Teachers | Math Whiz",
    description:
      "See AI-generated focus recommendations based on student math performance. Review weak subtopics, save drafts, apply focus areas, and plan interventions faster.",
    keyword: "ai student performance insights for math teachers",
  },
  "standards-aligned-math-app": {
    title: "Standards-Aligned Math App for Elementary - Common Core | Math Whiz",
    description:
      "Every question in Math Whiz maps to Common Core standards for 3rd and 4th grade math. See exactly which standards your students are practicing.",
    keyword: "standards-aligned math app elementary",
  },
  "multiplication-practice-3rd-grade": {
    title: "Multiplication Practice App for 3rd Grade - Build Fluency | Math Whiz",
    description:
      "Help your 3rd grader master multiplication with adaptive practice, arrays, word problems, and visual tools. Free multiplication app aligned to Common Core.",
    keyword: "multiplication practice app 3rd grade",
  },
  "fractions-app-for-kids": {
    title: "Fractions App for Kids - Visual & Adaptive Practice | Math Whiz",
    description:
      "Make fractions click for your child. Math Whiz uses visual models, adaptive difficulty, and step-by-step explanations to build real fraction understanding.",
    keyword: "fractions app for kids",
  },
  "fun-math-app-elementary": {
    title: "Fun Math App for Elementary School - Rewards & Drawing | Math Whiz",
    description:
      "Math practice that kids actually enjoy. Earn coins, unlock rewards, draw your work, and level up with adaptive challenges. Free for elementary students.",
    keyword: "fun math app elementary school",
  },
  "free-math-practice-app": {
    title: "Free Math Practice App for Elementary - No Ads, No Limits | Math Whiz",
    description:
      "Math Whiz is 100% free with no ads, no paywalls, and no limits. Full access to adaptive practice, teacher tools, and all topics for 3rd and 4th graders.",
    keyword: "free math practice app elementary",
  },
  "adaptive-math-app": {
    title: "Adaptive Math App for Kids - Personalized Practice | Math Whiz",
    description:
      "Math Whiz adapts to your child's level in real time. Questions get harder as they improve and easier when they struggle.",
    keyword: "adaptive math app for kids",
  },
  "common-core-math-app": {
    title: "Common Core Math App for 3rd & 4th Grade | Math Whiz",
    description:
      "Every Math Whiz question maps to specific Common Core standards. See topic-by-standard breakdowns for 3rd and 4th grade math.",
    keyword: "common core math app 3rd 4th grade",
  },
  "math-app-with-rewards": {
    title: "Math App with Rewards for Kids - Coins & Store | Math Whiz",
    description:
      "Kids earn coins for correct answers and spend them in the store. Math Whiz uses rewards to keep students motivated without pay-to-win mechanics.",
    keyword: "math app with rewards for kids",
  },
  "division-practice-3rd-grade": {
    title: "Division Practice App for 3rd Grade - Master the Basics | Math Whiz",
    description:
      "Build division fluency for 3rd graders with adaptive practice, word problems, and visual tools. Connects division to multiplication for deeper understanding.",
    keyword: "division practice 3rd grade",
  },
};

function escapeAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html.replace("</head>", `${replacement}</head>`);
}

function makeStructuredData(data) {
  const base = {
    "@context": "https://schema.org",
    "@type": data.type || "WebPage",
    name: data.title,
    description: data.description,
    url: data.canonical,
    isPartOf: {
      "@type": "WebApplication",
      name: SITE_NAME,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
    },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: ["student", "teacher", "parent"],
    },
  };

  if (data.keyword) {
    base.about = {
      "@type": "Thing",
      name: data.keyword,
    };
  }

  if (data.type === "WebApplication") {
    base.applicationCategory = "EducationalApplication";
    base.operatingSystem = "Web";
    base.educationalLevel = ["3rd Grade", "4th Grade"];
    base.offers = {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    };
  }

  return JSON.stringify(base).replace(/</g, "\\u003c");
}

function pageData(pathname) {
  if (pathname === "/about/") {
    return { redirectTo: `${SITE_URL}/about` };
  }

  if (pathname === "/about") {
    return { ...ABOUT_OVERVIEW, canonical: `${SITE_URL}/about` };
  }

  const trailingSlashMatch = pathname.match(/^\/about\/([^/]+)\/$/);
  if (trailingSlashMatch) {
    return { redirectTo: `${SITE_URL}/about/${trailingSlashMatch[1]}` };
  }

  const match = pathname.match(/^\/about\/([^/]+)$/);
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
  if (data.redirectTo) {
    return Response.redirect(data.redirectTo, 301);
  }

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();
  const title = escapeAttribute(data.title);
  const description = escapeAttribute(data.description);
  const canonical = escapeAttribute(data.canonical);
  const structuredData = makeStructuredData(data);

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
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="robots" content="index, follow" />',
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
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`,
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
  html = replaceTag(
    html,
    /<script\s+id="seo-json-ld"\s+type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script id="seo-json-ld" type="application/ld+json">${structuredData}</script>`,
  );

  const headers = new Headers(response.headers);
  headers.set("cache-control", "public, max-age=0, must-revalidate");
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
