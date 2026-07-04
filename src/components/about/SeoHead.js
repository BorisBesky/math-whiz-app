import { useEffect } from 'react';

/**
 * Sets document.title, meta description, and JSON-LD structured data for an SEO page.
 * Cleans up on unmount.
 */
const SeoHead = ({ title, description, keyword, slug }) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', description);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `https://mathwhizapp.kids/about/${slug}`);

    let script = document.getElementById('seo-json-ld');
    const createdScript = !script;
    const prevJson = script?.textContent;
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-json-ld';
      document.head.appendChild(script);
    }
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: `https://mathwhizapp.kids/about/${slug}`,
      isPartOf: {
        '@type': 'WebApplication',
        name: 'Math Whiz',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
      },
      about: {
        '@type': 'Thing',
        name: keyword,
      },
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: ['student', 'teacher', 'parent'],
      },
    });

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.setAttribute('content', prevDesc);
      if (createdScript) {
        document.head.removeChild(script);
      } else if (prevJson) {
        script.textContent = prevJson;
      }
      const canon = document.querySelector('link[rel="canonical"]');
      if (canon) canon.setAttribute('href', 'https://mathwhizapp.kids/');
    };
  }, [title, description, keyword, slug]);

  return null;
};

export default SeoHead;
