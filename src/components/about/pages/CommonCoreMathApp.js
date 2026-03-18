import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BookOpen, FileText, GraduationCap, BarChart2 } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const CommonCoreMathApp = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Common Core Math App for 3rd & 4th Grade
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        If your school follows Common Core standards, you need practice tools that align with what
        students are actually being taught and assessed on. Math Whiz maps every single question to
        a specific Common Core standard, making it easy for teachers to assign targeted practice and
        for parents to support classroom learning at home.
      </p>
    </header>

    {/* What Common Core means for math */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        What Common Core Means for Elementary Math
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        The Common Core State Standards for Mathematics define what students should understand and be
        able to do at each grade level. For 3rd and 4th graders, the standards emphasize:
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          'Conceptual understanding — not just procedures',
          'Multiple strategies for problem solving',
          'Fluency with key operations (multiplication in 3rd, multi-digit in 4th)',
          'Fraction understanding as a foundation for later math',
          'Connecting math to real-world contexts through word problems',
          'Geometric reasoning and measurement skills',
        ].map((item) => (
          <div key={item} className="flex items-start gap-2 bg-white border border-gray-200 rounded-lg px-4 py-3">
            <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-500" />
            <span className="text-sm text-gray-600">{item}</span>
          </div>
        ))}
      </div>
    </section>

    {/* How Math Whiz aligns */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        How Math Whiz Aligns to Common Core
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz wasn't retrofitted to match Common Core — it was built around the standards from
        the start. Here's how the alignment works:
      </p>
      <div className="space-y-4">
        {[
          {
            title: 'Every question has a standard code',
            desc: 'Each generated question includes the specific standard it addresses (e.g., 3.OA.7, 4.NF.1). Teachers can see which standards are being practiced at any time.',
          },
          {
            title: 'Topics map directly to standard domains',
            desc: 'Math Whiz\'s topic structure mirrors the Common Core domains: Operations & Algebraic Thinking, Number & Operations in Base Ten, Fractions, Measurement & Data, and Geometry.',
          },
          {
            title: 'Subtopics cover specific standards',
            desc: 'Within each topic, subtopics are organized to address individual standards. For example, the multiplication topic includes subtopics for facts fluency (3.OA.7), word problems (3.OA.3), and properties (3.OA.5).',
          },
          {
            title: 'Difficulty scaling matches standard expectations',
            desc: 'The difficulty range for each topic is calibrated to the depth of understanding the Common Core expects. A 3rd grader at difficulty 1.0 in multiplication is working at the level the standards describe as grade-level proficient.',
          },
        ].map(({ title, desc }) => (
          <div key={title} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Domain overview */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Common Core Domains Covered
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { code: 'OA', name: 'Operations & Algebraic Thinking', grades: '3rd & 4th', desc: 'Multiplication, division, word problems, patterns, and properties of operations' },
          { code: 'NBT', name: 'Number & Operations in Base Ten', grades: '4th', desc: 'Multi-digit arithmetic, place value, rounding, and comparison' },
          { code: 'NF', name: 'Number & Operations — Fractions', grades: '3rd & 4th', desc: 'Unit fractions, equivalence, comparison, addition/subtraction, and decimal notation' },
          { code: 'MD', name: 'Measurement & Data', grades: '3rd & 4th', desc: 'Time, mass, volume, area, perimeter, graphs, line plots, and angle measurement' },
          { code: 'G', name: 'Geometry', grades: '3rd & 4th', desc: 'Shape classification, attributes, partitioning, symmetry, and angle concepts' },
        ].map(({ code, name, grades, desc }) => (
          <div key={code} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-white bg-blue-600 rounded px-2 py-0.5">{code}</span>
              <span className="text-xs text-gray-400">{grades} grade</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Teacher value */}
    <Callout color="blue">
      <h3 className="text-xl font-bold text-gray-900 mb-3">Standards Reports for Teachers</h3>
      <p className="text-gray-700 leading-relaxed">
        The{' '}
        <Link to="/about/teacher-dashboard" className="text-blue-600 hover:underline">
          teacher dashboard
        </Link>{' '}
        shows per-student and class-wide data organized by standard. You can quickly identify which
        standards your class has covered, which ones need more instruction time, and which individual
        students are below proficiency on specific standards. This makes data-driven instruction
        planning straightforward. See our{' '}
        <Link to="/about/standards-aligned-math-app" className="text-blue-600 hover:underline">
          full standards alignment page
        </Link>{' '}
        for the complete standard-by-standard breakdown.
      </p>
    </Callout>

    {/* Parent perspective */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        For Parents: What Common Core Alignment Means
      </h2>
      <p className="text-gray-600 mb-4 leading-relaxed">
        If your child's school follows Common Core (as most U.S. public schools do), then the math
        they're learning in class follows a specific sequence and set of expectations. A Common Core
        aligned app means the practice your child does at home directly reinforces what they're
        doing at school — same vocabulary, same problem types, same conceptual approach.
      </p>
      <p className="text-gray-600 leading-relaxed">
        This is especially important for topics like fractions, where the Common Core approach
        (emphasizing number lines and conceptual understanding) differs from how many parents learned
        fractions. When the app and the classroom use the same framework, everyone is on the same page.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['standards-aligned-math-app', 'best-math-app-3rd-grade', 'best-math-app-4th-grade', 'teacher-dashboard']} />
  </PageWrapper>
);

export default CommonCoreMathApp;
