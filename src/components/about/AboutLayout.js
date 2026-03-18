import React, { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEO_PAGES } from './seoPageConfig';

const TABS = [
  { path: '/about', label: 'Overview' },
  ...SEO_PAGES.map((p) => ({ path: `/about/${p.slug}`, label: p.tabLabel })),
];

const AboutLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to App</span>
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Tab Bar */}
      <div className="sticky top-[49px] bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 py-2 min-w-max">
            {TABS.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  to={tab.path}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </div>
  );
};

export default AboutLayout;
