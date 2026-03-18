import React from 'react';
import { Link } from 'react-router-dom';
import { Slice, PenTool, TrendingUp, Brain, BookOpen, CheckCircle, Eye } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const FractionsAppForKids = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Fractions App for Kids
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Fractions are one of the most challenging topics for elementary students — and one of the most
        important. Research consistently shows that fraction understanding in elementary school is one
        of the strongest predictors of success in algebra and higher math. Math Whiz helps kids build
        real fraction understanding with visual models, adaptive practice, and clear explanations.
      </p>
    </header>

    {/* Why fractions are hard */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Fractions Are Hard (And How to Fix That)
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        Fractions break many of the "rules" that students learned with whole numbers. In whole number
        world, bigger numbers are always more — but 1/3 is less than 1/2, even though 3 is bigger
        than 2. Multiplying makes numbers bigger with whole numbers, but can make them smaller with
        fractions. These conceptual shifts are genuinely difficult.
      </p>
      <p className="text-gray-600 leading-relaxed">
        The key to overcoming these challenges is building conceptual understanding before procedural
        fluency. Students need to understand what a fraction represents — a part of a whole, a
        point on a number line, a division problem — before they can reliably compute with fractions.
        Math Whiz is designed to build that understanding step by step.
      </p>
    </section>

    {/* 3rd vs 4th grade */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Fraction Skills by Grade Level
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-white border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-50 px-5 py-3 border-b border-green-200">
            <h3 className="font-bold text-gray-900">3rd Grade Fractions</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-2">
              {[
                'Understanding unit fractions (1/2, 1/3, 1/4, etc.)',
                'Placing fractions on a number line',
                'Comparing fractions with same numerator or denominator',
                'Recognizing equivalent fractions',
                'Partitioning shapes into equal parts',
                'Representing fractions as parts of a whole',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-5 py-3 border-b border-blue-200">
            <h3 className="font-bold text-gray-900">4th Grade Fractions</h3>
          </div>
          <div className="p-5">
            <ul className="space-y-2">
              {[
                'Generating equivalent fractions',
                'Comparing fractions with unlike denominators',
                'Adding and subtracting fractions (like denominators)',
                'Multiplying fractions by whole numbers',
                'Converting between fractions and decimals',
                'Mixed numbers and improper fractions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle size={16} className="shrink-0 mt-0.5 text-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Visual approach */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Visual Fraction Tools That Build Understanding
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz uses visual models throughout its fraction content. Students don't just compute
        with fractions — they see and interact with them.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<PenTool size={24} className="text-blue-600" />}
          title="Drawing Canvas"
          description="Students can draw fraction bars, shade parts of shapes, and sketch number lines directly in the app. This hands-on approach builds the visual intuition that makes fractions make sense."
          color="blue"
        />
        <FeatureCard
          icon={<Eye size={24} className="text-blue-600" />}
          title="Visual Question Formats"
          description="Many fraction questions include diagrams — shaded shapes, number lines with marked intervals, and area models. Students learn to read and interpret visual fraction representations."
          color="blue"
        />
        <FeatureCard
          icon={<BookOpen size={24} className="text-blue-600" />}
          title="Step-by-Step Explanations"
          description="When a student gets a fraction problem wrong, the explanation uses visual models to show the reasoning — not just the procedure. This is how real fraction understanding develops."
          color="blue"
        />
        <FeatureCard
          icon={<Brain size={24} className="text-blue-600" />}
          title="Conceptual Before Procedural"
          description="Math Whiz introduces fraction concepts with visual models and simple comparisons before moving to computation. This sequence mirrors what research says works best for fraction learning."
          color="blue"
        />
      </div>
    </section>

    {/* Adaptive difficulty */}
    <Callout color="orange">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Adaptive Difficulty for Fractions</h3>
      <p className="text-gray-700 leading-relaxed">
        Fractions are a topic where students' skill levels vary dramatically within a single classroom.
        Math Whiz's{' '}
        <Link to="/about/adaptive-math-app" className="text-blue-600 hover:underline">
          adaptive difficulty system
        </Link>{' '}
        handles this by meeting each student exactly where they are. A student who is still building
        understanding of unit fractions will get different questions than one who is ready for adding
        fractions with like denominators. The difficulty adjusts question by question based on the
        student's responses.
      </p>
    </Callout>

    {/* For parents */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Parents Should Know About Fraction Practice
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        If your child is struggling with fractions, you're not alone — it's one of the most common
        areas where students need extra support. Here's how to make the most of Math Whiz for
        fraction practice:
      </p>
      <div className="space-y-3">
        {[
          "Start with the basics. Even if your child is in 4th grade, make sure they're solid on unit fractions and number line placement before moving to operations.",
          "Encourage drawing. When your child uses the sketch pad to model fractions visually, they build understanding that lasts — not just short-term memorization.",
          "Check the dashboard. Look at accuracy by subtopic to see which fraction skills are solid and which ones need more time.",
          "Be patient with fractions. They represent a genuine conceptual shift from whole number thinking. Progress may feel slower than with other topics, and that's normal.",
        ].map((tip, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600">{tip}</p>
          </div>
        ))}
      </div>
    </section>

    <CallToAction />
    <RelatedPages slugs={['best-math-app-3rd-grade', 'best-math-app-4th-grade', 'standards-aligned-math-app', 'adaptive-math-app']} />
  </PageWrapper>
);

export default FractionsAppForKids;
