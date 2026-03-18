import React from 'react';
import { Link } from 'react-router-dom';
import { PenTool, Flame, Brain, Star, Coins, Palette } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const FunMathAppElementary = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Fun Math App for Elementary School
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Most kids don't wake up excited about math practice. But the right app can change that.
        Math Whiz combines real curriculum content with rewards, drawing tools, and adaptive
        challenges that make elementary math practice something kids actually want to do.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/rewards-store.jpg"
        alt="Math Whiz rewards store where kids spend earned coins on fun character backgrounds"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* What makes it fun */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Makes Math Practice Fun?
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Fun in a math app doesn't mean turning math into a video game where learning is an
        afterthought. The best kind of fun comes from the math itself — the satisfaction of solving
        a challenging problem, the motivation of seeing progress, and the engagement of interactive
        tools that make abstract concepts tangible. Math Whiz is designed around this principle:
        fun that reinforces learning, not distracts from it.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Coins size={24} className="text-green-600" />}
          title="Earn Coins for Every Correct Answer"
          description="Students earn coins as they answer questions correctly. The coins are real motivation — kids want to earn more, which means they want to practice more. It's a simple loop that works."
          color="green"
        />
        <FeatureCard
          icon={<Palette size={24} className="text-green-600" />}
          title="Spend Coins in the Store"
          description="Coins aren't just numbers — students can spend them in the rewards store to unlock fun backgrounds and customize their experience. It gives the coins meaning and gives students a goal to work toward."
          color="green"
        />
        <FeatureCard
          icon={<PenTool size={24} className="text-green-600" />}
          title="Draw and Sketch"
          description="The built-in drawing canvas turns math into a hands-on activity. Students can sketch arrays, draw number lines, shade fractions, and show their work — it's more engaging than tapping buttons."
          color="green"
        />
        <FeatureCard
          icon={<Flame size={24} className="text-green-600" />}
          title="Streaks and Challenges"
          description="Correct answer streaks create a natural challenge. Students push themselves to maintain their streak, which drives both accuracy and focus during practice sessions."
          color="green"
        />
      </div>
    </section>

    {/* Not just drill */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        More Than Just Drill-and-Kill
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        Many math apps are glorified flash cards — they present a problem, you type an answer, repeat.
        That gets boring fast. Math Whiz takes a different approach:
      </p>
      <div className="space-y-3">
        {[
          {
            title: 'Varied question formats',
            desc: 'Multiple choice, numeric entry, fill-in-the-blank, and drawing questions keep practice sessions feeling fresh instead of repetitive.',
          },
          {
            title: 'Adaptive difficulty',
            desc: 'Questions get harder as students improve. That constant edge-of-ability challenge is what makes practice feel engaging rather than tedious.',
          },
          {
            title: 'Explanations that teach',
            desc: 'When students get a problem wrong, they see a clear, visual explanation. Mistakes become learning moments — not just red X marks.',
          },
          {
            title: 'Real math content',
            desc: 'Every question covers real curriculum standards. The fun doesn\'t come at the expense of learning — it enhances it.',
          },
        ].map(({ title, desc }) => (
          <div key={title} className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Rewards system */}
    <Callout color="green">
      <h3 className="text-xl font-bold text-gray-900 mb-3">The Rewards System: Motivation Without Manipulation</h3>
      <p className="text-gray-700 leading-relaxed">
        Math Whiz's{' '}
        <Link to="/about/math-app-with-rewards" className="text-blue-600 hover:underline">
          coin and rewards system
        </Link>{' '}
        is designed to encourage consistent practice, not create addictive loops. Coins are earned
        through correct answers — there are no loot boxes, no randomized rewards, and no way to
        buy progress with real money. The store items are cosmetic and fun, giving students
        something to work toward while keeping the focus squarely on learning.
      </p>
    </Callout>

    {/* Parent perspective */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Parents Say
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Parents consistently tell us that Math Whiz solves a specific problem: their child needs math
        practice, but fights them on doing worksheets. The coin system, streak tracking, and drawing
        tools create enough engagement that kids will practice voluntarily — often asking to "play
        Math Whiz" instead of being told to practice math.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Brain size={24} className="text-blue-600" />}
          title="Adaptive = Always Engaging"
          description="Because questions adjust to your child's level, they're never too easy (boring) or too hard (frustrating). That sweet spot is what keeps kids coming back."
          color="blue"
        />
        <FeatureCard
          icon={<Star size={24} className="text-blue-600" />}
          title="Progress You Can See"
          description="Kids love seeing their accuracy go up and their coin balance grow. Parents love seeing which topics their child has mastered and which ones need more work."
          color="blue"
        />
      </div>
    </section>

    {/* All the curriculum */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Covers the Full Elementary Math Curriculum
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Math Whiz isn't just fun — it's comprehensive. The app covers all major math topics for{' '}
        <Link to="/about/best-math-app-3rd-grade" className="text-blue-600 hover:underline">
          3rd grade
        </Link>{' '}
        and{' '}
        <Link to="/about/best-math-app-4th-grade" className="text-blue-600 hover:underline">
          4th grade
        </Link>
        : multiplication, division, fractions, geometry, measurement, and more. Every question is{' '}
        <Link to="/about/standards-aligned-math-app" className="text-blue-600 hover:underline">
          aligned to Common Core standards
        </Link>
        , so the fun practice your child is doing directly supports what they're learning in school.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['math-app-with-rewards', 'adaptive-math-app', 'free-math-practice-app', 'best-math-app-3rd-grade']} />
  </PageWrapper>
);

export default FunMathAppElementary;
