import React from 'react';
import { Link } from 'react-router-dom';
import { Sliders, TrendingUp, Brain, Target, BarChart2, Smile, Zap } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const AdaptiveMathAppForKids = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Adaptive Math App for Kids
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Every child learns math at their own pace. An adaptive math app meets students where they
        are — making questions harder when they're ready and easier when they're struggling. Math
        Whiz's adaptive engine adjusts difficulty in real time, question by question, to keep every
        student in their optimal learning zone.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/student-dashboard.jpg"
        alt="Math Whiz student dashboard showing progress across topics with accuracy and performance metrics"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* What adaptive means */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Does "Adaptive" Actually Mean?
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        Many apps claim to be adaptive, but the term gets used loosely. In Math Whiz, adaptive means
        the app tracks each student's performance and adjusts the difficulty of the next question
        based on how they've been doing. This happens on a continuous scale — not just "easy,"
        "medium," and "hard" levels.
      </p>
      <p className="text-gray-600 leading-relaxed">
        Math Whiz uses a difficulty scale from 0.0 to 1.0 for every topic. As a student answers
        questions correctly, the difficulty gradually increases. When they start making mistakes,
        it dials back. The result is a practice session that's always at the right level —
        challenging enough to drive growth, but not so hard that it causes frustration.
      </p>
    </section>

    {/* How it works */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Math Whiz Adapts to Your Child
      </h2>
      <div className="space-y-4">
        {[
          {
            icon: <Sliders size={20} className="text-blue-600" />,
            title: 'Continuous Difficulty Scale',
            desc: 'Every topic uses a 0.0 to 1.0 difficulty range. Questions are generated at the precise difficulty level that matches each student\'s current ability, not just broad "easy/medium/hard" buckets.',
          },
          {
            icon: <TrendingUp size={20} className="text-blue-600" />,
            title: 'Real-Time Adjustment',
            desc: 'Difficulty updates after every answer. A student who gets three in a row right will see the next question step up in complexity. A student who misses one will get a slightly easier question next. The adjustments are smooth and immediate.',
          },
          {
            icon: <Target size={20} className="text-blue-600" />,
            title: 'Per-Topic Tracking',
            desc: 'A student might be at difficulty 0.7 in multiplication but 0.3 in fractions. Math Whiz tracks difficulty independently for every topic and subtopic, so progress in one area doesn\'t inflate difficulty in another.',
          },
          {
            icon: <Brain size={20} className="text-blue-600" />,
            title: 'Question Generation, Not Selection',
            desc: 'Math Whiz doesn\'t pull questions from a fixed bank — it generates them procedurally based on the target difficulty. This means the app never runs out of questions at any difficulty level, and students rarely see the same question twice.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5">
            <div className="shrink-0 mt-0.5 p-1 bg-blue-50 rounded-lg">{icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Why adaptive matters */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Adaptive Practice Works Better
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Research on learning consistently shows that students learn most effectively when they're
        working at the edge of their ability — what educational psychologists call the "zone of
        proximal development." Too easy, and students zone out. Too hard, and they shut down.
        Adaptive practice keeps students in that productive middle zone.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Smile size={24} className="text-green-600" />}
          title="No Frustration"
          description="When a student is struggling, questions get easier. They build confidence with manageable problems before the difficulty climbs back up. No one gets stuck on problems that are way over their head."
          color="green"
        />
        <FeatureCard
          icon={<Zap size={24} className="text-green-600" />}
          title="No Boredom"
          description="Students who have mastered the basics aren't stuck doing easy problems they already know. The difficulty pushes them forward to new challenges as fast as they're ready."
          color="green"
        />
        <FeatureCard
          icon={<TrendingUp size={24} className="text-green-600" />}
          title="Faster Progress"
          description="By always working at the right level, students spend more time learning and less time doing problems that are too easy or too hard. Every practice minute is productive."
          color="green"
        />
        <FeatureCard
          icon={<BarChart2 size={24} className="text-green-600" />}
          title="Visible Growth"
          description="The difficulty level itself becomes a measure of progress. Students can see their difficulty level increase over time — concrete proof that they're getting better at math."
          color="green"
        />
      </div>
    </section>

    {/* Comparison */}
    <Callout color="blue">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Adaptive vs. Static Practice</h3>
      <p className="text-gray-700 mb-4 leading-relaxed">
        Traditional worksheets and many basic math apps use static difficulty — every student gets the
        same problems. In a classroom of 25 students, this means the problems are too easy for some
        and too hard for others. Only a handful are actually working at the right level.
      </p>
      <p className="text-gray-700 leading-relaxed">
        Math Whiz's adaptive approach means all 25 students are working at their optimal difficulty
        level simultaneously. The student who struggles with multiplication facts gets problems at
        their level. The student who's ready for multi-step word problems gets those instead. Same
        app, same classroom, individualized practice.
      </p>
    </Callout>

    {/* For teachers */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Adaptive Practice for Teachers
      </h2>
      <p className="text-gray-600 leading-relaxed">
        The{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          teacher dashboard
        </Link>{' '}
        shows each student's current difficulty level for every topic. You can see at a glance who is
        progressing, who is plateaued, and who might need intervention. Combined with accuracy data
        and the ability to{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          assign specific topics
        </Link>{' '}
        to individual students, the adaptive system becomes a powerful tool for differentiated
        instruction.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['fun-math-app-elementary', 'best-math-app-3rd-grade', 'teacher-dashboard', 'free-math-practice-app']} />
  </PageWrapper>
);

export default AdaptiveMathAppForKids;
