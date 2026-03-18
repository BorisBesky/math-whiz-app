import React from 'react';
import { Link } from 'react-router-dom';
import { Divide, PenTool, Brain, BookOpen, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const DivisionPractice3rdGrade = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Division Practice App for 3rd Grade
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Division is introduced in 3rd grade as the inverse of multiplication. Students who understand
        the connection between the two operations develop much stronger number sense. Math Whiz
        provides adaptive division practice that builds this understanding from the ground up.
      </p>
    </header>

    {/* Division in 3rd grade */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What 3rd Graders Need to Know About Division
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        The Common Core standards (3.OA.2, 3.OA.3, 3.OA.4, 3.OA.6, 3.OA.7) expect 3rd graders to
        understand division as sharing equally and as the inverse of multiplication. By the end of
        the year, students should be able to fluently divide within 100 and solve word problems
        involving division.
      </p>
      <p className="text-gray-600 leading-relaxed">
        This is a significant step. Division requires students to think backward from multiplication
        — "what number times 4 equals 20?" — which is a more complex cognitive operation than
        straightforward multiplication. The key is building this understanding gradually with varied
        problem types and strong connections to multiplication facts.
      </p>
    </section>

    {/* Subtopics */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Division Skills Covered in Math Whiz
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { topic: 'Basic Division Facts', detail: 'Division within 100, building automaticity with fact families. Connected to multiplication facts so students see the relationship.' },
          { topic: 'Division as Equal Sharing', detail: 'Understanding division as splitting a total into equal groups. "If 15 stickers are shared equally among 3 friends, how many does each get?"' },
          { topic: 'Division as Grouping', detail: 'Understanding division as making groups of a specific size. "How many groups of 4 can you make from 24 items?"' },
          { topic: 'Fact Families', detail: 'Connecting multiplication and division facts. If 6 × 7 = 42, then 42 ÷ 7 = 6 and 42 ÷ 6 = 7. Building this connection is critical for fluency.' },
          { topic: 'Division Word Problems', detail: 'Applying division to real-world situations: equal sharing, measurement, and comparison problems that require choosing division as the operation.' },
          { topic: 'Unknown Factor Problems', detail: 'Finding the missing number: _ × 5 = 35. These problems bridge multiplication and division, building algebraic thinking.' },
        ].map(({ topic, detail }) => (
          <div key={topic} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-green-500" />
              <h3 className="font-semibold text-gray-900">{topic}</h3>
            </div>
            <p className="text-sm text-gray-500">{detail}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Connection to multiplication */}
    <Callout color="orange">
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        Division and Multiplication: Two Sides of the Same Coin
      </h3>
      <p className="text-gray-700 leading-relaxed">
        Math Whiz emphasizes the connection between multiplication and division throughout its
        content. When a student practices division, the explanations reference related multiplication
        facts. When they practice{' '}
        <Link to="/about/multiplication-practice-3rd-grade" className="text-blue-600 hover:underline">
          multiplication
        </Link>
        , the connection to division is woven in. This dual approach builds the fact family
        understanding that makes both operations more fluent. Students who see multiplication and
        division as related — not separate — develop stronger number sense overall.
      </p>
    </Callout>

    {/* Difficulty progression */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Difficulty Progresses
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Division difficulty scales from basic facts to complex word problems:
      </p>
      <div className="space-y-3">
        {[
          { level: 'Beginning (0.0–0.3)', desc: 'Dividing by 1, 2, 5, and 10. Small dividends (up to 30). Multiple choice format with clear answer options.' },
          { level: 'Developing (0.3–0.5)', desc: 'Division facts through 49 ÷ 7. Mix of question types. Simple word problems with straightforward language.' },
          { level: 'Proficient (0.5–0.7)', desc: 'Full fact fluency through 100 ÷ 10. Numeric entry. Word problems requiring identification of division as the correct operation.' },
          { level: 'Advanced (0.7–1.0)', desc: 'Unknown factor problems, multi-step word problems combining division with other operations, and fact family reasoning questions.' },
        ].map(({ level, desc }) => (
          <div key={level} className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{level}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Features */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Math Whiz for Division Practice
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Brain size={24} className="text-green-600" />}
          title="Adaptive Difficulty"
          description="Questions adjust to each student's level. Students who need more time with basic facts get that time. Students ready for word problems move forward."
          color="green"
        />
        <FeatureCard
          icon={<PenTool size={24} className="text-green-600" />}
          title="Show Your Work"
          description="Students can draw equal groups, sketch arrays, and model division problems visually using the built-in drawing canvas."
          color="green"
        />
        <FeatureCard
          icon={<BookOpen size={24} className="text-green-600" />}
          title="Clear Explanations"
          description="When a student misses a division problem, the explanation shows the reasoning — often referencing the related multiplication fact to strengthen the connection."
          color="green"
        />
        <FeatureCard
          icon={<TrendingUp size={24} className="text-green-600" />}
          title="Track Fluency Growth"
          description="See accuracy and difficulty progression over time. Parents and teachers can monitor exactly which division skills are solid and which need more practice."
          color="green"
        />
      </div>
    </section>

    {/* Tips */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Tips for Supporting Division Learning at Home
      </h2>
      <div className="space-y-3">
        {[
          'Make sure multiplication facts are solid first. Division relies on multiplication knowledge — a student who doesn\'t know 6 × 8 = 48 will struggle with 48 ÷ 8.',
          'Use real-world examples. Sharing snacks equally, dividing into teams, splitting a collection — these concrete examples make division meaningful.',
          'Encourage the "think multiplication" strategy. When your child sees 42 ÷ 7, help them think "what times 7 equals 42?" This builds the fact family connection.',
          'Be patient with word problems. Division word problems require students to both identify the operation AND compute the answer. That\'s two cognitive steps, and it takes practice.',
        ].map((tip, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">{tip}</p>
          </div>
        ))}
      </div>
    </section>

    <CallToAction />
    <RelatedPages slugs={['multiplication-practice-3rd-grade', 'best-math-app-3rd-grade', 'math-practice-app-3rd-grade', 'fractions-app-for-kids']} />
  </PageWrapper>
);

export default DivisionPractice3rdGrade;
