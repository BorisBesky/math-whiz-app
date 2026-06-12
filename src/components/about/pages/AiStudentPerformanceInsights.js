import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BarChart2, Target, CheckCircle2, ClipboardList, ArrowRight } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

function ScreenshotPlaceholder({ title, description, bullets }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-blue-700 mb-3">
        <Sparkles size={18} />
        <span className="text-sm font-semibold uppercase tracking-wide">Screenshot Placeholder</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="mt-3 text-gray-700 leading-relaxed">{description}</p>
      <ul className="mt-4 space-y-2 text-sm text-gray-600">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <CheckCircle2 size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const AiStudentPerformanceInsights = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        AI Student Performance Insights for Math Teachers
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Math Whiz now helps teachers move from raw student data to concrete next steps. The AI
        reviews recent performance, flags weak subtopics, explains why they matter, and lets you
        save reviewed drafts or apply approved focus recommendations to a student's practice plan.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/teacher-students.jpg"
        alt="Math Whiz teacher analytics view with student performance data by topic"
        className="w-full"
        loading="lazy"
      />
    </div>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What the New AI Insights Feature Does
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Instead of manually scanning accuracy numbers and trying to decide what each student should
        practice next, teachers can ask Math Whiz to analyze performance by topic and subtopic.
        The AI returns recommended focus areas, confidence signals, supporting metrics, and a plain
        language summary that helps you decide what to assign next.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<BarChart2 size={24} className="text-blue-600" />}
          title="Analyzes Real Student Work"
          description="Recommendations are based on answered questions, accuracy, attempt volume, and recent date ranges rather than generic curriculum templates."
          color="blue"
        />
        <FeatureCard
          icon={<Target size={24} className="text-blue-600" />}
          title="Recommends Specific Subtopics"
          description="The AI points to concrete weak spots like a single multiplication or fractions subtopic so intervention stays focused instead of broad."
          color="blue"
        />
        <FeatureCard
          icon={<ClipboardList size={24} className="text-blue-600" />}
          title="Explains the Why"
          description="Each recommendation includes a reason and supporting metrics, which makes the output reviewable before anything is applied."
          color="blue"
        />
        <FeatureCard
          icon={<Sparkles size={24} className="text-blue-600" />}
          title="Supports Draft Review"
          description="Teachers can save a recommendation draft, come back later, and review it before deciding whether to apply the suggested focus areas."
          color="blue"
        />
        <FeatureCard
          icon={<ArrowRight size={24} className="text-blue-600" />}
          title="Applies Reviewed Focus Areas"
          description="Once the suggestions look right, teachers can apply them directly to the student's Focus Areas instead of re-entering assignments by hand."
          color="blue"
        />
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Teachers Use It
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <ScreenshotPlaceholder
          title="AI Focus Recommendations Panel"
          description="Recommended screenshot: the student detail view after analysis runs, showing the summary, recommended subtopics, confidence labels, supporting metrics, and the selected date range."
          bullets={[
            'Show the AI summary above the recommendation cards.',
            'Include at least one subtopic recommendation with accuracy and attempts.',
            'Keep the visible date range in frame so teachers understand the analysis window.',
          ]}
        />
        <ScreenshotPlaceholder
          title="Draft Review or Apply Flow"
          description="Recommended screenshot: the saved draft state before applying recommendations, or the success state after the focus areas have been applied."
          bullets={[
            'Show the Save draft or Apply recommendations control in context.',
            'Capture the confirmation state or applied badge if available.',
            'If possible, include the updated Focus Areas nearby to make the result obvious.',
          ]}
        />
      </div>
    </section>

    <Callout color="blue">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Why This Matters for Intervention</h3>
      <p className="text-gray-700 leading-relaxed">
        Teachers usually do not need more dashboards. They need faster decisions. AI focus
        recommendations reduce the time between noticing a problem and assigning the right follow-up
        practice, especially when a class has many students working at different levels.
      </p>
    </Callout>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Fits Into the Existing Teacher Workflow
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        This feature extends the existing{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          teacher dashboard
        </Link>{' '}
        rather than creating another disconnected workflow. Teachers can review analytics, run the
        AI analysis, apply focus areas, and continue assigning custom or AI-generated practice from
        the same classroom management surface.
      </p>
      <p className="text-gray-600 leading-relaxed">
        For schools already using Math Whiz for intervention blocks, RTI support, homework, or test
        prep, this makes the platform more useful because the next instructional step is clearer.
      </p>
      <p className="text-gray-600 mt-4 leading-relaxed">
        If you want the full monitoring workflow around those recommendations, visit{' '}
        <Link to="/about/student-math-progress-monitoring" className="text-blue-600 hover:underline">
          student math progress monitoring
        </Link>{' '}
        for the broader teacher use case.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['student-math-progress-monitoring', 'teacher-dashboard', 'free-math-practice-app', 'standards-aligned-math-app']} />
  </PageWrapper>
);

export default AiStudentPerformanceInsights;
