import React from 'react';
import { PenTool, TrendingUp, Brain, BookOpen, CheckCircle } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const MultiplicationPractice3rdGrade = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Multiplication Practice App for 3rd Grade
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Multiplication is the cornerstone of 3rd grade math. Students who build strong multiplication
        fluency in third grade have a much easier time with division, fractions, and multi-step
        problems later on. Math Whiz provides the adaptive, engaging multiplication practice that
        3rd graders need.
      </p>
    </header>

    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/quiz-interface.jpg"
        alt="Math Whiz multiplication quiz showing an adaptive word problem with number pad and drawing tools"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* Why multiplication fluency matters */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Multiplication Fluency Is Critical in 3rd Grade
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        The Common Core standards (3.OA.7) expect 3rd graders to "fluently multiply and divide within
        100." This isn't just about memorizing times tables — it means understanding what multiplication
        represents, recognizing when to use it, and computing answers quickly enough to focus on
        higher-level reasoning.
      </p>
      <p className="text-gray-600 leading-relaxed">
        Students who don't develop multiplication fluency in 3rd grade often struggle in 4th grade
        and beyond, where multiplication is used constantly in fraction operations, multi-digit
        arithmetic, and measurement. The investment in fluency now pays off for years.
      </p>
    </section>

    {/* Subtopics */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Multiplication Skills Covered
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz breaks multiplication into focused subtopics so students build understanding
        step by step. Each subtopic has its own difficulty curve, starting simple and scaling up
        as the student demonstrates mastery.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { topic: 'Multiplication Facts (0-12)', detail: 'Build automaticity with single-digit multiplication through varied practice formats: multiple choice, numeric entry, and fill-in-the-blank' },
          { topic: 'Arrays & Equal Groups', detail: 'Understand multiplication as repeated addition through visual models. Students draw and interpret arrays to connect the concept to the computation' },
          { topic: 'Properties of Multiplication', detail: 'Commutative, associative, and distributive properties. Students learn that 3 × 4 = 4 × 3 and can break apart harder problems' },
          { topic: 'Multiplication Word Problems', detail: 'Apply multiplication to real-world scenarios: equal groups, area problems, arrays, and comparison situations' },
          { topic: 'Multi-Step Problems', detail: 'Combine multiplication with addition or subtraction in two-step word problems, building toward the complexity of 4th grade math' },
          { topic: 'Patterns in Multiplication', detail: 'Recognize and explain patterns in the multiplication table, like why multiples of 5 always end in 0 or 5' },
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

    {/* How difficulty scales */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Difficulty Scales
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz uses a difficulty system from 0.0 to 1.0 that adapts to each student. Here's how
        multiplication difficulty progresses:
      </p>
      <div className="space-y-3">
        {[
          { level: 'Introductory (0.0–0.3)', desc: 'Multiplying by 0, 1, 2, 5, and 10. Smaller numbers. Multiple choice with well-spaced options.' },
          { level: 'Developing (0.3–0.5)', desc: 'Facts through 7 × 7. Mix of question types. Word problems with straightforward language.' },
          { level: 'Proficient (0.5–0.7)', desc: 'Full facts through 12 × 12. Numeric entry without choices. Multi-step word problems.' },
          { level: 'Advanced (0.7–1.0)', desc: 'Application problems, pattern recognition, properties questions, and problems requiring multiple strategies.' },
        ].map(({ level, desc }) => (
          <div key={level} className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-1">{level}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Drawing tools */}
    <Callout color="orange">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Draw Arrays and Show Your Work</h3>
      <p className="text-gray-700 leading-relaxed">
        Multiplication in 3rd grade isn't just about getting the right answer — it's about understanding
        what multiplication means. Math Whiz includes a built-in drawing canvas where students can
        sketch arrays, draw equal groups, and model area. This builds the visual reasoning that makes
        multiplication make sense, not just something to memorize.
      </p>
    </Callout>

    {/* Features */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Math Whiz for Multiplication Practice
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Brain size={24} className="text-green-600" />}
          title="Adapts to Your Child"
          description="No more practicing facts they already know or struggling with problems that are too hard. The adaptive engine finds the sweet spot for productive practice."
          color="green"
        />
        <FeatureCard
          icon={<PenTool size={24} className="text-green-600" />}
          title="Visual Problem Solving"
          description="The drawing canvas lets students model multiplication with arrays and groups — the same strategies their teacher uses in class."
          color="green"
        />
        <FeatureCard
          icon={<TrendingUp size={24} className="text-green-600" />}
          title="Track Fluency Growth"
          description="Watch your child's accuracy and speed improve over time. The dashboard shows exactly which facts are solid and which ones need more practice."
          color="green"
        />
        <FeatureCard
          icon={<BookOpen size={24} className="text-green-600" />}
          title="Learn From Mistakes"
          description="Every wrong answer comes with a clear explanation. Students don't just see the right answer — they understand why it's right."
          color="green"
        />
      </div>
    </section>

    <CallToAction />
    <RelatedPages slugs={['division-practice-3rd-grade', 'best-math-app-3rd-grade', 'math-practice-app-3rd-grade', 'standards-aligned-math-app']} />
  </PageWrapper>
);

export default MultiplicationPractice3rdGrade;
