import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Target, PenTool, BarChart2, BookOpen, Repeat } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const MathPracticeApp3rdGrade = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Math Practice App for 3rd Grade
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Daily math practice is one of the most effective ways to build fluency and confidence in 3rd
        grade. But not all practice is equal — students need the right level of challenge, immediate
        feedback, and variety to actually improve. That's exactly what Math Whiz delivers.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/quiz-interface.jpg"
        alt="Math Whiz quiz interface showing an adaptive multiplication word problem with number pad and sketch tools"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* Why daily practice matters */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Daily Math Practice Matters in 3rd Grade
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Third grade is when the math curriculum shifts from learning how to count and add to applying
        mathematical reasoning. Students need to build automaticity with multiplication facts while
        simultaneously developing conceptual understanding of fractions, measurement, and geometry.
        Consistent daily practice — even 10 to 15 minutes — has been shown to significantly improve
        both speed and comprehension.
      </p>
      <p className="text-gray-600 leading-relaxed">
        The challenge is keeping that practice engaging day after day. Worksheets get repetitive.
        Flash cards don't adapt. Math Whiz solves this by generating fresh questions every session,
        automatically adjusting difficulty, and rewarding progress with coins and streaks.
      </p>
    </section>

    {/* How Math Whiz builds fluency */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Math Whiz Builds Real Fluency
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Target size={24} className="text-green-600" />}
          title="Adaptive Question Generation"
          description="Every question is procedurally generated with a difficulty level from 0.0 to 1.0. As your child masters easier problems, the app progressively introduces harder ones. No two practice sessions are the same."
          color="green"
        />
        <FeatureCard
          icon={<Repeat size={24} className="text-green-600" />}
          title="Spaced Repetition of Weak Areas"
          description="Math Whiz tracks which subtopics your child struggles with and revisits them more frequently. This spaced repetition approach is proven to improve long-term retention."
          color="green"
        />
        <FeatureCard
          icon={<PenTool size={24} className="text-green-600" />}
          title="Drawing Tools for Problem Solving"
          description="Students can draw arrays, number lines, and area models directly in the app. This builds the visual reasoning skills that 3rd grade math demands — not just the ability to pick the right multiple-choice answer."
          color="green"
        />
        <FeatureCard
          icon={<BookOpen size={24} className="text-green-600" />}
          title="Step-by-Step Explanations"
          description="When a student gets a question wrong, they see a clear explanation of how to solve it. This turns mistakes into learning moments instead of dead ends."
          color="green"
        />
      </div>
    </section>

    {/* Skills covered */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Skills Your 3rd Grader Will Practice
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz covers the full 3rd grade math curriculum, organized into clear topics and subtopics.
        Students can focus on specific skills or work through a mixed practice session.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          'Multiplication facts',
          'Arrays & equal groups',
          'Multiplication word problems',
          'Division facts',
          'Division word problems',
          'Unit fractions',
          'Fractions on number lines',
          'Comparing fractions',
          'Perimeter',
          'Area concepts',
          'Shape attributes',
          'Telling time',
          'Measuring mass & volume',
          'Bar graphs & picture graphs',
          'Two-step word problems',
        ].map((skill) => (
          <div key={skill} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm font-medium text-green-800">
            {skill}
          </div>
        ))}
      </div>
    </section>

    {/* Tracking progress */}
    <Callout color="green">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Track Every Step of Progress</h3>
      <p className="text-gray-700 leading-relaxed">
        The student dashboard shows accuracy rates, current streaks, and performance trends for every
        topic. Parents can check in at any time to see which skills their child is mastering and which
        ones need more work. Teachers get even more detail with{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          classroom-level analytics
        </Link>{' '}
        that show individual student progress across every subtopic.
      </p>
    </Callout>

    {/* Practical tips */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Tips for Effective Daily Practice
      </h2>
      <div className="space-y-3">
        {[
          { icon: <Clock size={18} className="text-blue-600" />, text: 'Keep sessions short — 10 to 15 minutes is ideal for 3rd graders. Consistency matters more than duration.' },
          { icon: <Target size={18} className="text-blue-600" />, text: 'Let the adaptive system work. Don\'t skip ahead to harder topics before your child has built fluency at their current level.' },
          { icon: <BarChart2 size={18} className="text-blue-600" />, text: 'Check the dashboard weekly. Look for topics where accuracy is below 70% — those need focused attention.' },
          { icon: <PenTool size={18} className="text-blue-600" />, text: 'Encourage your child to use the drawing tools. Showing work builds deeper understanding than just selecting answers.' },
        ].map(({ icon, text }, i) => (
          <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
            <div className="shrink-0 mt-0.5">{icon}</div>
            <p className="text-sm text-gray-600">{text}</p>
          </div>
        ))}
      </div>
    </section>

    <CallToAction />
    <RelatedPages slugs={['best-math-app-3rd-grade', 'multiplication-practice-3rd-grade', 'division-practice-3rd-grade', 'adaptive-math-app']} />
  </PageWrapper>
);

export default MathPracticeApp3rdGrade;
