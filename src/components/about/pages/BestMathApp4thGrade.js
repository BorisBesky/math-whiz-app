import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, PenTool, BarChart2, CheckCircle, TrendingUp } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const BestMathApp4thGrade = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Best Math App for 4th Graders
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Fourth grade math takes a serious leap. Students are expected to multiply multi-digit numbers,
        work with fractions and decimals, understand angles and symmetry, and tackle multi-step word
        problems. The best math app for 4th graders needs to keep up with that complexity while
        keeping practice engaging.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/topic-selection.jpg"
        alt="Math Whiz topic selection screen showing grade-level math topics with progress tracking"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* 4th grade challenges */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why 4th Grade Math Is a Turning Point
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Research shows that 4th grade is when many students either build lasting math confidence or
        start falling behind. The curriculum jumps from concrete arithmetic to more abstract concepts
        like equivalent fractions, multi-step problem solving, and geometric reasoning. A strong
        math app doesn't just drill facts — it builds the conceptual understanding students need to
        succeed in upper elementary and beyond.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Multi-digit multiplication', desc: 'Up to 4 digits by 1 digit, 2 digits by 2 digits' },
          { label: 'Fraction operations', desc: 'Adding, subtracting, comparing, and equivalent fractions' },
          { label: 'Geometry & measurement', desc: 'Angles, symmetry, perimeter, area, and unit conversion' },
        ].map(({ label, desc }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Topics covered */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        4th Grade Topics in Math Whiz
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz provides comprehensive coverage of the 4th grade math curriculum. Each topic
        includes procedurally generated questions that scale in difficulty, plus AI-generated
        questions that teachers can customize. Here's the full breakdown:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { topic: 'Multi-Digit Multiplication', detail: 'Multiply up to 4-digit numbers, area models, partial products, and estimation strategies' },
          { topic: 'Long Division', detail: 'Division with remainders, multi-digit dividends, and real-world word problems' },
          { topic: 'Fractions & Decimals', detail: 'Equivalent fractions, comparing fractions, adding/subtracting fractions, decimal notation' },
          { topic: 'Geometry', detail: 'Angle measurement, classifying shapes, lines of symmetry, and points/lines/rays' },
          { topic: 'Measurement & Data', detail: 'Unit conversion, perimeter and area, line plots, and elapsed time' },
          { topic: 'Place Value & Number Sense', detail: 'Multi-digit comparison, rounding, expanded form through millions' },
        ].map(({ topic, detail }) => (
          <div key={topic} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={18} className="text-blue-500" />
              <h3 className="font-semibold text-gray-900">{topic}</h3>
            </div>
            <p className="text-sm text-gray-500">{detail}</p>
          </div>
        ))}
      </div>
    </section>

    {/* What sets Math Whiz apart */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Makes Math Whiz the Best Choice for 4th Grade
      </h2>
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <FeatureCard
            icon={<Brain size={24} className="text-blue-600" />}
            title="Adaptive Difficulty That Scales"
            description="4th grade math ranges from basic fact review to complex multi-step problems. Math Whiz's adaptive engine moves students through that range at their own pace, ensuring they're always challenged but never overwhelmed."
            color="blue"
          />
          <FeatureCard
            icon={<PenTool size={24} className="text-blue-600" />}
            title="Show Your Work"
            description="4th graders are expected to explain their reasoning. The built-in drawing canvas lets students show area models, draw fraction bars, sketch angles, and work through long division step by step."
            color="blue"
          />
          <FeatureCard
            icon={<BarChart2 size={24} className="text-blue-600" />}
            title="Detailed Progress Tracking"
            description="See accuracy, time spent, and growth for every topic and subtopic. Parents can identify exactly which skills need more practice, and teachers get real-time classroom analytics."
            color="blue"
          />
          <FeatureCard
            icon={<TrendingUp size={24} className="text-blue-600" />}
            title="Built for Growth"
            description="Math Whiz covers both 3rd and 4th grade content, so students who need to revisit earlier concepts can do so seamlessly. Students working ahead can access more challenging material."
            color="blue"
          />
        </div>
      </div>
    </section>

    {/* Teacher tools */}
    <Callout color="blue">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Powerful Teacher Tools</h3>
      <p className="text-gray-700 leading-relaxed">
        Teachers using Math Whiz get a full{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          classroom dashboard
        </Link>{' '}
        with real-time student analytics, the ability to assign specific topics to individual
        students, upload custom questions from upcoming tests, and generate new practice problems
        with AI. It's everything you need to differentiate instruction for a classroom of 4th
        graders — without the prep time.
      </p>
    </Callout>

    {/* Standards */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Aligned to 4th Grade Standards
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Every question in Math Whiz maps to specific Common Core standards for 4th grade: 4.OA
        (Operations & Algebraic Thinking), 4.NBT (Number & Operations in Base Ten), 4.NF (Number &
        Operations — Fractions), 4.MD (Measurement & Data), and 4.G (Geometry). Teachers can see
        which standards each student is practicing and where gaps remain. Visit our{' '}
        <Link to="/about/standards-aligned-math-app" className="text-blue-600 hover:underline">
          standards alignment page
        </Link>{' '}
        for the full mapping.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['best-math-app-3rd-grade', 'teacher-dashboard', 'standards-aligned-math-app', 'adaptive-math-app']} />
  </PageWrapper>
);

export default BestMathApp4thGrade;
