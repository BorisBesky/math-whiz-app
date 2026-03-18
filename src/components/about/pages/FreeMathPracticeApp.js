import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShieldCheck, Users, BookOpen, Sparkles, Heart, Ban } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const FreeMathPracticeApp = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Free Math Practice App for Elementary
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Math Whiz is completely free — no trial periods, no premium tiers, no per-student pricing,
        and no ads. Every feature available in Math Whiz is accessible to every student, teacher,
        and parent at no cost. Here's why, and here's what you get.
      </p>
    </header>

    {/* Why free */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Math Whiz Is Free
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        Effective math practice shouldn't depend on a family's ability to pay for a subscription. Too
        many educational apps gate their best features behind monthly fees, creating a gap where
        students who need the most support have access to the fewest tools. Math Whiz exists to
        close that gap.
      </p>
      <p className="text-gray-600 leading-relaxed">
        Every school, every classroom, every home should have access to adaptive, curriculum-aligned
        math practice with real teacher tools. That's the principle Math Whiz is built on. No
        "freemium" tricks — the free version is the only version, and it includes everything.
      </p>
    </section>

    {/* What's included */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What's Included — Everything
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        There is no paid tier. Here's the complete list of features that every user gets for free:
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<BookOpen size={24} className="text-green-600" />}
          title="Full Curriculum Access"
          description="Every topic and subtopic for 3rd and 4th grade math. Multiplication, division, fractions, geometry, measurement, and more. No locked content."
          color="green"
        />
        <FeatureCard
          icon={<Sparkles size={24} className="text-green-600" />}
          title="Adaptive Difficulty"
          description="The full adaptive engine that adjusts questions to each student's level. Not a simplified version — the same system for everyone."
          color="green"
        />
        <FeatureCard
          icon={<Users size={24} className="text-green-600" />}
          title="Teacher Dashboard"
          description="Class creation, invite codes, real-time analytics, per-student assignments, custom content upload, and AI question generation. All free."
          color="green"
        />
        <FeatureCard
          icon={<ShieldCheck size={24} className="text-green-600" />}
          title="Unlimited Practice"
          description="No daily limits on questions, sessions, or topics. Students can practice as much as they want, whenever they want."
          color="green"
        />
      </div>
    </section>

    {/* No ads, no tricks */}
    <Callout color="green">
      <h3 className="text-xl font-bold text-gray-900 mb-3">No Ads. No Data Selling. No Tricks.</h3>
      <p className="text-gray-700 leading-relaxed">
        Math Whiz doesn't show advertisements to students. We don't sell user data. There are no
        in-app purchases, no premium subscriptions, and no "upgrade to unlock" prompts. When we say
        free, we mean it in the simplest possible way: you use it, you don't pay for it, and nothing
        sketchy happens behind the scenes.
      </p>
    </Callout>

    {/* What this means for teachers */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What This Means for Teachers
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        If you've ever tried to adopt an educational app for your classroom, you know the drill:
        the free version is too limited, the school version requires a purchase order, and by the
        time the budget gets approved the school year is half over.
      </p>
      <p className="text-gray-600 mb-4 leading-relaxed">
        Math Whiz eliminates that process entirely. You can sign up right now, create a class, and
        have your students practicing tomorrow. No budget approval. No IT department involvement.
        No contracts. The full{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          teacher dashboard
        </Link>{' '}
        — analytics, custom content, AI generation, per-student assignments — is included.
      </p>
    </section>

    {/* What this means for families */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What This Means for Families
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        For parents looking for supplemental math practice, free means you can try Math Whiz without
        risk. Your child gets full access to{' '}
        <Link to="/about/adaptive-math-app" className="text-blue-600 hover:underline">
          adaptive practice
        </Link>
        , drawing tools, progress tracking, the{' '}
        <Link to="/about/math-app-with-rewards" className="text-blue-600 hover:underline">
          coin reward system
        </Link>
        , and clear explanations. If your child likes it, great — keep using it. If they don't, you
        haven't lost anything.
      </p>
      <p className="text-gray-600 leading-relaxed">
        There's no pressure to upgrade because there's nothing to upgrade to. Every feature is yours
        from day one.
      </p>
    </section>

    {/* Comparison */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Math Whiz Compares
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-900">Feature</th>
              <th className="text-center px-4 py-3 font-semibold text-green-700">Math Whiz (Free)</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-500">Typical Paid App</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              ['Adaptive difficulty', 'Included', 'Premium only'],
              ['All topics & subtopics', 'Included', 'Locked behind paywall'],
              ['Teacher dashboard', 'Included', '$5–15/student/year'],
              ['Custom content upload', 'Included', 'Premium only'],
              ['AI question generation', 'Included', 'Not available'],
              ['Unlimited practice', 'Included', 'Daily limits on free tier'],
              ['Ads', 'None', 'Free tier shows ads'],
            ].map(([feature, whiz, other]) => (
              <tr key={feature}>
                <td className="px-4 py-3 text-gray-700">{feature}</td>
                <td className="px-4 py-3 text-center text-green-700 font-medium">{whiz}</td>
                <td className="px-4 py-3 text-center text-gray-400">{other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <CallToAction />
    <RelatedPages slugs={['teacher-dashboard', 'fun-math-app-elementary', 'best-math-app-3rd-grade', 'adaptive-math-app']} />
  </PageWrapper>
);

export default FreeMathPracticeApp;
