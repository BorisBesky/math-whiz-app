import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { PageWrapper, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const StandardsAlignedMathApp = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Standards-Aligned Math App for Elementary
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        When teachers adopt a math app, the first question is always: does it align with what I'm
        required to teach? Math Whiz is built from the ground up around Common Core State Standards
        for 3rd and 4th grade math. Every question maps to a specific standard, so you know exactly
        what your students are practicing.
      </p>
    </header>

    {/* Why alignment matters */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Why Standards Alignment Matters
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        A math app that isn't aligned to standards can actually be counterproductive. Students might
        spend time practicing skills they won't be assessed on while missing the ones they need.
        Standards-aligned practice ensures that every minute a student spends in the app directly
        supports what they're learning in class.
      </p>
      <p className="text-gray-600 leading-relaxed">
        For teachers, standards alignment means you can confidently assign Math Whiz as supplemental
        practice knowing it reinforces your instruction rather than contradicting it. For parents,
        it means your child is practicing what actually matters for school success.
      </p>
    </section>

    {/* 3rd grade standards */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        3rd Grade Common Core Standards Coverage
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz covers all five 3rd grade math domains. Each question includes a standard code
        so teachers can track exactly which standards students are practicing.
      </p>
      <div className="space-y-4">
        {[
          {
            code: '3.OA',
            name: 'Operations & Algebraic Thinking',
            standards: [
              '3.OA.1 — Interpret products of whole numbers',
              '3.OA.2 — Interpret quotients of whole numbers',
              '3.OA.3 — Multiply and divide within 100 to solve word problems',
              '3.OA.4 — Determine unknown numbers in multiplication/division equations',
              '3.OA.5 — Apply properties of operations',
              '3.OA.7 — Fluently multiply and divide within 100',
              '3.OA.8 — Solve two-step word problems',
              '3.OA.9 — Identify arithmetic patterns',
            ],
          },
          {
            code: '3.NF',
            name: 'Number & Operations — Fractions',
            standards: [
              '3.NF.1 — Understand unit fractions',
              '3.NF.2 — Understand fractions on a number line',
              '3.NF.3 — Explain equivalence and compare fractions',
            ],
          },
          {
            code: '3.MD',
            name: 'Measurement & Data',
            standards: [
              '3.MD.1 — Tell and write time; solve elapsed time problems',
              '3.MD.2 — Measure and estimate liquid volumes and masses',
              '3.MD.3 — Draw and interpret picture/bar graphs',
              '3.MD.4 — Generate measurement data and make line plots',
              '3.MD.5–7 — Understand area and relate to multiplication',
              '3.MD.8 — Solve perimeter problems',
            ],
          },
          {
            code: '3.G',
            name: 'Geometry',
            standards: [
              '3.G.1 — Classify shapes by attributes',
              '3.G.2 — Partition shapes into equal parts',
            ],
          },
        ].map(({ code, name, standards }) => (
          <div key={code} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">
                <span className="text-blue-600">{code}</span> — {name}
              </h3>
            </div>
            <div className="p-5">
              <ul className="space-y-2">
                {standards.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* 4th grade standards */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        4th Grade Common Core Standards Coverage
      </h2>
      <div className="space-y-4">
        {[
          {
            code: '4.OA',
            name: 'Operations & Algebraic Thinking',
            standards: [
              '4.OA.1 — Interpret a multiplication equation as a comparison',
              '4.OA.2 — Multiply or divide to solve word problems with comparisons',
              '4.OA.3 — Solve multistep word problems',
              '4.OA.4 — Find factor pairs, determine prime/composite',
              '4.OA.5 — Generate and analyze number patterns',
            ],
          },
          {
            code: '4.NBT',
            name: 'Number & Operations in Base Ten',
            standards: [
              '4.NBT.1 — Place value understanding for multi-digit numbers',
              '4.NBT.2 — Read, write, and compare multi-digit numbers',
              '4.NBT.3 — Round multi-digit whole numbers',
              '4.NBT.4 — Fluently add and subtract multi-digit numbers',
              '4.NBT.5 — Multiply up to four-digit by one-digit',
              '4.NBT.6 — Divide up to four-digit by one-digit',
            ],
          },
          {
            code: '4.NF',
            name: 'Number & Operations — Fractions',
            standards: [
              '4.NF.1 — Explain and generate equivalent fractions',
              '4.NF.2 — Compare fractions with different denominators',
              '4.NF.3 — Add and subtract fractions with like denominators',
              '4.NF.4 — Multiply a fraction by a whole number',
              '4.NF.5–7 — Understand decimal notation for fractions',
            ],
          },
          {
            code: '4.MD',
            name: 'Measurement & Data',
            standards: [
              '4.MD.1 — Measurement unit conversions',
              '4.MD.2 — Use four operations to solve measurement problems',
              '4.MD.3 — Apply area and perimeter formulas',
              '4.MD.4 — Make line plots with fractional data',
              '4.MD.5–7 — Recognize and measure angles',
            ],
          },
          {
            code: '4.G',
            name: 'Geometry',
            standards: [
              '4.G.1 — Draw and identify lines, angles, and shapes',
              '4.G.2 — Classify shapes by properties of lines and angles',
              '4.G.3 — Recognize lines of symmetry',
            ],
          },
        ].map(({ code, name, standards }) => (
          <div key={code} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-purple-50 px-5 py-3 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">
                <span className="text-purple-600">{code}</span> — {name}
              </h3>
            </div>
            <div className="p-5">
              <ul className="space-y-2">
                {standards.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-500" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* How it works */}
    <Callout color="purple">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Standards Tracking for Teachers</h3>
      <p className="text-gray-700 leading-relaxed">
        Every question in Math Whiz includes its Common Core standard code. The{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          teacher dashboard
        </Link>{' '}
        lets you see which standards each student has practiced and their accuracy on each one.
        This makes it easy to identify gaps and plan targeted instruction — no spreadsheets required.
      </p>
    </Callout>

    <CallToAction />
    <RelatedPages slugs={['common-core-math-app', 'teacher-dashboard', 'best-math-app-3rd-grade', 'best-math-app-4th-grade']} />
  </PageWrapper>
);

export default StandardsAlignedMathApp;
