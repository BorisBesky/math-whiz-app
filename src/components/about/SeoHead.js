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

    const script = document.createElement('script');
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
    document.head.appendChild(script);

    return () => {
      document.title = prevTitle;
      if (meta && prevDesc) meta.setAttribute('content', prevDesc);
      document.head.removeChild(script);
      const canon = document.querySelector('link[rel="canonical"]');
      if (canon) canon.setAttribute('href', 'https://mathwhizapp.kids/');
    };
  }, [title, description, keyword, slug]);

  return null;
};

export default SeoHead;
