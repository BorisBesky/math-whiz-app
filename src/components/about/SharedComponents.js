import React from 'react';
import { Link } from 'react-router-dom';
import { SEO_PAGES } from './seoPageConfig';

export function FeatureCard({ icon, title, description, color, highlight }) {
  const borderColor = color === 'blue' ? 'border-blue-200' : 'border-green-200';
  const bgHighlight = highlight
    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-300'
    : 'bg-white';

  return (
    <div
      className={`${bgHighlight} border ${borderColor} rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-1">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <p className="mt-1 text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function CallToAction() {
  return (
    <section className="text-center mt-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to start?</h2>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        Students can jump in as guests instantly. Teachers can create a free account and set up a
        class in under two minutes.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/student-login?guest=true"
          className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition shadow-sm"
        >
          Try as Student
        </Link>
        <Link
          to="/teacher-login?mode=signup"
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          Sign Up as Teacher
        </Link>
      </div>
    </section>
  );
}

export function RelatedPages({ slugs }) {
  const pages = slugs
    .map((s) => SEO_PAGES.find((p) => p.slug === s))
    .filter(Boolean);

  if (pages.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Related Pages</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page) => (
          <Link
            key={page.slug}
            to={`/about/${page.slug}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition group"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
              {page.tabLabel}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{page.metaDescription}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PageWrapper({ children }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-20 space-y-12">{children}</div>
  );
}

export function Callout({ color = 'blue', children }) {
  const styles = {
    blue: 'from-blue-50 to-indigo-50 border-blue-200',
    green: 'from-green-50 to-emerald-50 border-green-200',
    orange: 'from-orange-50 to-yellow-50 border-orange-200',
    purple: 'from-purple-50 to-indigo-50 border-purple-200',
  };
  return (
    <div className={`bg-gradient-to-r ${styles[color]} border rounded-2xl p-6 sm:p-8`}>
      {children}
    </div>
  );
}
