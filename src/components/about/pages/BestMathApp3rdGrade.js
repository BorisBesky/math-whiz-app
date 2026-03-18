import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, BookOpen, PenTool, Trophy, BarChart2, Target, CheckCircle } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const BestMathApp3rdGrade = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Best Math App for 3rd Graders
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Third grade is when math gets real. Students move from counting and basic addition into
        multiplication, division, fractions, and geometry — all in a single school year. The right
        math app can make that transition smoother, more engaging, and far less stressful for both
        kids and parents.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/topic-selection.jpg"
        alt="Math Whiz topic selection screen showing 3rd grade math topics: Multiplication, Division, Fractions, and Measurement"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* What makes a great 3rd grade math app */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Makes a Great Math App for 3rd Graders?
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Not all math apps are created equal. The best math app for 3rd graders should do more than
        flash multiplication tables on a screen. It needs to meet students where they are, adjust to
        their pace, and cover the full range of skills they're expected to learn in third grade.
        Here's what to look for:
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Brain size={24} className="text-green-600" />}
          title="Adaptive Difficulty"
          description="Questions should get harder as your child improves and easier when they struggle. This keeps practice productive without causing frustration or boredom."
          color="green"
        />
        <FeatureCard
          icon={<BookOpen size={24} className="text-green-600" />}
          title="Full Curriculum Coverage"
          description="A strong 3rd grade math app covers multiplication, division, fractions, measurement, geometry, and word problems — not just one or two skills."
          color="green"
        />
        <FeatureCard
          icon={<PenTool size={24} className="text-green-600" />}
          title="Space to Show Work"
          description="Kids learn math by doing, not just tapping answers. Drawing arrays, number lines, and area models builds conceptual understanding."
          color="green"
        />
        <FeatureCard
          icon={<Trophy size={24} className="text-green-600" />}
          title="Meaningful Motivation"
          description="Rewards and progress tracking keep kids coming back. But the motivation should reinforce learning, not distract from it."
          color="green"
        />
      </div>
    </section>

    {/* Topics covered */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        3rd Grade Math Topics Covered in Math Whiz
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz covers every major math strand that 3rd graders encounter during the school year.
        Each topic includes multiple subtopics with questions that scale from introductory to
        challenging. Here's what your child can practice:
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { topic: 'Multiplication', detail: 'Facts, arrays, word problems, properties of multiplication, and multi-step problems' },
          { topic: 'Division', detail: 'Basic facts, relationship to multiplication, word problems, and equal groups' },
          { topic: 'Fractions', detail: 'Unit fractions, fractions on number lines, comparing fractions, and equivalent fractions' },
          { topic: 'Geometry', detail: 'Shapes and attributes, perimeter, area concepts, and partitioning shapes' },
          { topic: 'Measurement & Data', detail: 'Time, mass, liquid volume, picture graphs, bar graphs, and line plots' },
          { topic: 'Operations & Algebraic Thinking', detail: 'Patterns, two-step word problems, and properties of operations' },
        ].map(({ topic, detail }) => (
          <div key={topic} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={18} className="text-green-500" />
              <h3 className="font-semibold text-gray-900">{topic}</h3>
            </div>
            <p className="text-sm text-gray-500">{detail}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Why Math Whiz */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Parents Choose Math Whiz for 3rd Grade
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz was built specifically for elementary students — it's not a watered-down version
        of a middle school app. The content, interface, and difficulty levels are all designed for
        the 3rd and 4th grade experience. Here's what sets it apart:
      </p>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1 p-1 bg-blue-100 rounded-lg">
            <Target size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Questions adapt in real time</h3>
            <p className="text-sm text-gray-600">
              Math Whiz uses a difficulty scale from 0.0 to 1.0. As your child answers correctly,
              the difficulty increases. When they struggle, it dials back. This means every practice
              session is productive — your child is always working at the edge of what they know.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1 p-1 bg-blue-100 rounded-lg">
            <PenTool size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Built-in drawing canvas</h3>
            <p className="text-sm text-gray-600">
              Many 3rd grade math problems require showing work — drawing arrays for multiplication,
              sketching fractions on number lines, or modeling area with grids. Math Whiz includes a
              sketch pad directly in the quiz interface so students can work through problems
              visually, just like they would on paper.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1 p-1 bg-blue-100 rounded-lg">
            <BarChart2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Progress you can actually see</h3>
            <p className="text-sm text-gray-600">
              The student dashboard tracks accuracy, streaks, and topic-by-topic performance over
              time. Parents and teachers can see exactly where a student is thriving and where they
              need more practice — no guesswork.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Standards alignment callout */}
    <Callout color="blue">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Aligned to Common Core Standards</h3>
      <p className="text-gray-700 leading-relaxed">
        Every question in Math Whiz maps to specific Common Core standards for 3rd grade math. Whether
        your child is working on 3.OA (Operations & Algebraic Thinking), 3.NF (Number & Fractions),
        3.MD (Measurement & Data), or 3.G (Geometry), the questions are designed to reinforce exactly
        what they're learning in school. Learn more on our{' '}
        <Link to="/about/standards-aligned-math-app" className="text-blue-600 hover:underline">
          standards alignment page
        </Link>.
      </p>
    </Callout>

    {/* For teachers/parents */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Tools for Parents and Teachers
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Math Whiz isn't just for kids. Parents can track their child's progress from any device, and
        teachers get a full{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          classroom dashboard
        </Link>{' '}
        with real-time analytics, custom assignments, and AI-powered question generation. Whether
        you're a parent supplementing homework or a teacher running a class of 30, Math Whiz gives
        you the visibility you need to help every student succeed.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['best-math-app-4th-grade', 'multiplication-practice-3rd-grade', 'fractions-app-for-kids', 'fun-math-app-elementary']} />
  </PageWrapper>
);

export default BestMathApp3rdGrade;
