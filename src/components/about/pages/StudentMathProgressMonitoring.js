import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Layers3,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

function ScreenshotPlaceholder({ title, description, bullets }) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-blue-700 mb-3">
        <BarChart2 size={18} />
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

const StudentMathProgressMonitoring = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Student Math Progress Monitoring for Teachers
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Math Whiz gives teachers a cleaner way to monitor student math growth over time. Instead
        of checking one score at the end of the week, you can review question history, compare date
        ranges, follow students across more than one class, and turn that evidence into targeted
        intervention plans.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/teacher-students.jpg"
        alt="Math Whiz teacher student list showing performance metrics and class progress"
        className="w-full"
        loading="lazy"
      />
    </div>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Teachers Can See Now
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Recent Math Whiz updates expanded the teacher workflow beyond a basic roster. Teachers can
        open a student detail view, inspect recent attempts, narrow the history to a useful date
        range, and keep intervention decisions connected to the same student record.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Clock3 size={24} className="text-blue-600" />}
          title="Question-Level History"
          description="Review the exact questions a student answered, not just a single accuracy percentage. That makes it easier to spot repeated mistakes and partial understanding."
          color="blue"
        />
        <FeatureCard
          icon={<CalendarRange size={24} className="text-blue-600" />}
          title="Date-Range Filtering"
          description="Focus on the most recent intervention block, homework cycle, or tutoring week so the data matches the instructional decision you need to make."
          color="blue"
        />
        <FeatureCard
          icon={<Layers3 size={24} className="text-blue-600" />}
          title="Multi-Class Visibility"
          description="Students can belong to more than one class, which is useful for intervention groups, homeroom plus support blocks, or shared teacher coverage."
          color="blue"
        />
        <FeatureCard
          icon={<Target size={24} className="text-blue-600" />}
          title="Actionable Next Steps"
          description="Use the same evidence to guide Focus Areas, custom assignments, and follow-up practice instead of moving between separate tracking tools."
          color="blue"
        />
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Suggested Screenshot Coverage
      </h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <ScreenshotPlaceholder
          title="Student Detail View With History"
          description="Recommended screenshot: the expanded student detail panel showing summary metrics above the question history list."
          bullets={[
            'Include the student overview and visible question history in the same frame.',
            'Keep any date filter controls visible to show this is not a static report.',
            'If possible, show a mix of correct and incorrect attempts so the workflow is obvious.',
          ]}
        />
        <ScreenshotPlaceholder
          title="Multi-Class Student Profile"
          description="Recommended screenshot: the student profile or class-selection screen showing that one student can be connected to multiple classes."
          bullets={[
            'Show at least two enrolled classes in the visible state.',
            'Keep the selected class or practice context visible if available.',
            'Use a real example name only if it is safe to publish; otherwise anonymize it.',
          ]}
        />
      </div>
    </section>

    <Callout color="blue">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Why This Helps RTI and Small-Group Support</h3>
      <p className="text-gray-700 leading-relaxed">
        Progress monitoring is most useful when it is specific and recent. Teachers running
        intervention groups, RTI blocks, after-school tutoring, or parent-supported homework plans
        need to know whether a student is improving on the exact skills being practiced. Math Whiz
        keeps that evidence close to the assignment workflow.
      </p>
    </Callout>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Connect Monitoring to Intervention
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        This page works best alongside the main{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          teacher dashboard
        </Link>{' '}
        and the{' '}
        <Link to="/about/ai-student-performance-insights" className="text-blue-600 hover:underline">
          AI student performance insights
        </Link>{' '}
        workflow. Teachers can inspect the evidence, ask the AI to summarize weak subtopics, save a
        draft recommendation when they need to review it later, and then apply approved focus areas
        to the student plan.
      </p>
      <p className="text-gray-600 leading-relaxed">
        For schools that need free tools, Math Whiz keeps this workflow available inside the{' '}
        <Link to="/about/free-math-practice-app" className="text-blue-600 hover:underline">
          free platform
        </Link>{' '}
        without adding paid reporting tiers.
      </p>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Where This Fits
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Users size={24} className="text-blue-600" />}
          title="Classroom Teachers"
          description="Track class-wide patterns, then drill down into the students who need small-group reteaching before the next lesson."
          color="blue"
        />
        <FeatureCard
          icon={<Sparkles size={24} className="text-blue-600" />}
          title="Intervention Specialists"
          description="Use recent attempts and AI-supported summaries to document growth and decide what the next targeted practice block should cover."
          color="blue"
        />
      </div>
    </section>

    <CallToAction />
    <RelatedPages slugs={['teacher-dashboard', 'ai-student-performance-insights', 'free-math-practice-app', 'standards-aligned-math-app']} />
  </PageWrapper>
);

export default StudentMathProgressMonitoring;
