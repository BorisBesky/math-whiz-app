import React, { Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPageBySlug } from './seoPageConfig';
import SeoHead from './SeoHead';

const AboutSeoPage = () => {
  const { slug } = useParams();
  const page = getPageBySlug(slug);

  if (!page) return <Navigate to="/about" replace />;

  const PageComponent = page.component;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <SeoHead
        title={page.title}
        description={page.metaDescription}
        keyword={page.keyword}
        slug={page.slug}
      />
      <PageComponent />
    </Suspense>
  );
};

export default AboutSeoPage;
