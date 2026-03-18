import React from 'react';
import { Link } from 'react-router-dom';
import { Coins, Trophy, Palette, Flame, ShieldCheck } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const MathAppWithRewards = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Math App with Rewards for Kids
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Kids need motivation to practice math consistently. Math Whiz uses a coin-based reward
        system that makes every practice session feel rewarding — without turning math into a video
        game or using manipulative mechanics. Earn coins by solving problems correctly, spend them
        in the store on fun customizations.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/rewards-store.jpg"
        alt="Math Whiz rewards store showing animal backgrounds that kids can unlock with earned coins"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* How the rewards work */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How the Reward System Works
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        The reward loop in Math Whiz is simple and transparent. Students answer math questions. When
        they get answers right, they earn coins. They can spend those coins in the store to customize
        their experience. Here's the breakdown:
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Coins size={24} className="text-yellow-600" />}
          title="Earn Coins"
          description="Every correct answer earns coins. Harder questions and longer streaks earn more. The system rewards both accuracy and persistence — students who keep practicing earn more than those who give up after a few tries."
          color="green"
        />
        <FeatureCard
          icon={<Palette size={24} className="text-yellow-600" />}
          title="Spend in the Store"
          description="The rewards store offers fun backgrounds and visual customizations that students can unlock with their earned coins. These are purely cosmetic — they don't affect the learning experience."
          color="green"
        />
        <FeatureCard
          icon={<Flame size={24} className="text-yellow-600" />}
          title="Streaks"
          description="Correct answer streaks multiply the sense of achievement. Students naturally push themselves to maintain their streak, which drives focus and accuracy during practice."
          color="green"
        />
        <FeatureCard
          icon={<Trophy size={24} className="text-yellow-600" />}
          title="Visible Progress"
          description="The coin balance is always visible, and the student dashboard shows growth over time. Kids can see the direct connection between practice and reward."
          color="green"
        />
      </div>
    </section>

    {/* Why rewards work */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Rewards Work for Math Practice
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        The challenge with math practice is consistency. A student who practices 10 minutes a day for
        a month will learn dramatically more than one who does an hour once a week. But getting
        elementary students to sit down and practice daily is a real challenge for parents and
        teachers.
      </p>
      <p className="text-gray-600 mb-4 leading-relaxed">
        The coin system solves this by giving students a reason to come back. They want to earn enough
        coins for that next background. They want to beat their longest streak. They want to see their
        balance grow. The math practice is the same — but the motivation to do it is stronger.
      </p>
      <p className="text-gray-600 leading-relaxed">
        Critically, Math Whiz's reward system is designed so that the only way to earn coins is by
        doing real math. There are no shortcuts, no ways to buy coins, and no mechanics that reward
        anything other than correct answers to curriculum-aligned questions.
      </p>
    </section>

    {/* Not pay-to-win */}
    <Callout color="green">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Not Pay-to-Win. Not Addictive.</h3>
      <p className="text-gray-700 mb-4 leading-relaxed">
        Math Whiz's reward system is intentionally designed to avoid the dark patterns found in many
        kids' apps:
      </p>
      <ul className="space-y-2">
        {[
          'No real-money purchases — coins can only be earned through math practice',
          'No loot boxes or randomized rewards — students always know what they\'re earning',
          'No daily login bonuses that create obligation — rewards come from actual learning',
          'No artificial scarcity or limited-time offers — the store is always available',
          'No social pressure mechanics — students don\'t compete for coins or compare balances',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2 text-gray-700">
            <ShieldCheck size={16} className="shrink-0 mt-1 text-green-600" />
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </Callout>

    {/* For parents */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        A Parent's Perspective on Math Rewards
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        If you've tried other math apps, you may have seen reward systems that feel more like mobile
        game monetization than educational tools. Math Whiz takes a different approach: rewards exist
        to motivate practice, and practice is where the learning happens.
      </p>
      <p className="text-gray-600 mb-4 leading-relaxed">
        The practical impact is that kids ask to use Math Whiz. Instead of "time to do your math
        practice," it becomes "can I play Math Whiz?" The learning is identical — the motivation is
        completely different.
      </p>
      <p className="text-gray-600 leading-relaxed">
        And because Math Whiz is{' '}
        <Link to="/about/free-math-practice-app" className="text-blue-600 hover:underline">
          completely free
        </Link>
        , there's no risk of your child accidentally spending real money in the store. The store only
        accepts earned coins.
      </p>
    </section>

    {/* Combined with other features */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Rewards + Adaptive Practice = Consistent Growth
      </h2>
      <p className="text-gray-600 leading-relaxed">
        The reward system works best in combination with Math Whiz's{' '}
        <Link to="/about/adaptive-math-app" className="text-blue-600 hover:underline">
          adaptive difficulty engine
        </Link>
        . Because questions are always at the right level, students earn coins at a steady rate —
        not so fast that it feels meaningless, and not so slow that it feels impossible. This creates
        a sustainable motivation loop: practice, earn, spend, and come back tomorrow for more. The
        result is consistent daily practice that builds real{' '}
        <Link to="/about/math-practice-app-3rd-grade" className="text-blue-600 hover:underline">
          math fluency
        </Link>{' '}
        over time.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['fun-math-app-elementary', 'adaptive-math-app', 'free-math-practice-app', 'best-math-app-3rd-grade']} />
  </PageWrapper>
);

export default MathAppWithRewards;
