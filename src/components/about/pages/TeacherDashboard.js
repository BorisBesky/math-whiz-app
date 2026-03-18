import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Target, ClipboardList, Sparkles, UserPlus, Eye, Settings } from 'lucide-react';
import { PageWrapper, FeatureCard, CallToAction, RelatedPages, Callout } from '../SharedComponents';

const TeacherDashboard = () => (
  <PageWrapper>
    <header>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
        Math App with Teacher Dashboard
      </h1>
      <p className="mt-4 text-lg text-gray-600 max-w-3xl">
        Teaching math to a room full of students at different levels is one of the hardest jobs in
        education. Math Whiz gives teachers a real-time dashboard to see exactly where every student
        stands — and the tools to do something about it.
      </p>
    </header>

    {/* Screenshot */}
    <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <img
        src="/images/seo/teacher-dashboard.jpg"
        alt="Math Whiz teacher dashboard showing student metrics, accuracy tracking, and recent activity"
        className="w-full"
        loading="lazy"
      />
    </div>

    {/* Class management */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Set Up a Class in Under Two Minutes
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Getting started is simple. Create a teacher account, name your class, and you'll get a unique
        join code. Share the code with your students — they enter it on any device to join. No
        student email addresses required. Students can start as guests and create accounts later to
        save their progress across sessions.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { step: '1', title: 'Create your class', desc: 'Name it, pick a grade level, and get your join code' },
          { step: '2', title: 'Share the code', desc: 'Students enter the code from any device — phone, tablet, or computer' },
          { step: '3', title: 'Start teaching', desc: 'See live analytics as students begin practicing' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="bg-white border border-blue-200 rounded-xl p-5 text-center">
            <div className="w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center mx-auto mb-3">
              {step}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Real-time analytics */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Real-Time Student Analytics
      </h2>
      <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
        <img
          src="/images/seo/teacher-students.jpg"
          alt="Math Whiz student analytics showing accuracy, questions answered, and topic performance per student"
          className="w-full"
          loading="lazy"
        />
      </div>
      <p className="text-gray-600 mb-6 leading-relaxed">
        The teacher dashboard shows you every student's performance as they practice. You can see
        accuracy rates, time spent per topic, streak data, and detailed question-level results.
        No more waiting until a test to find out a student is struggling — Math Whiz shows you in
        real time.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Eye size={24} className="text-blue-600" />}
          title="Live Performance View"
          description="See which students are online, what they're working on, and how they're doing — all updated in real time as students answer questions."
          color="blue"
        />
        <FeatureCard
          icon={<BarChart2 size={24} className="text-blue-600" />}
          title="Topic-by-Topic Breakdown"
          description="View accuracy and attempt counts for every topic and subtopic. Quickly identify which areas need more class time and which students need individual attention."
          color="blue"
        />
        <FeatureCard
          icon={<Target size={24} className="text-blue-600" />}
          title="Per-Student Detail"
          description="Drill into any student's profile to see their complete history: every topic they've practiced, every question they've answered, and their difficulty progression over time."
          color="blue"
        />
        <FeatureCard
          icon={<Settings size={24} className="text-blue-600" />}
          title="Class-Wide Insights"
          description="See aggregate data across your entire class. Which topics have the lowest accuracy? Which students are falling behind the class average? Prioritize your instruction with data."
          color="blue"
        />
      </div>
    </section>

    {/* Custom content */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Upload Custom Content and Assign It
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Math Whiz isn't locked to a fixed question bank. Teachers can upload their own questions —
        from textbooks, worksheets, upcoming tests, or original material. Assign different question
        sets to different students based on what each one needs to practice. Preparing for a unit
        test? Upload the exact types of problems your students will encounter.
      </p>
      <Callout color="blue">
        <h3 className="text-xl font-bold text-gray-900 mb-3">AI Question Generation</h3>
        <p className="text-gray-700 leading-relaxed">
          Need more practice problems? Math Whiz can generate batches of 25 curriculum-aligned
          questions with one click. Choose the topic, subtopic, and difficulty level, and the AI
          creates new questions that match your specifications. Every generated question includes
          the correct answer, a hint, and the relevant Common Core standard.
        </p>
      </Callout>
    </section>

    {/* Differentiated instruction */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Built for Differentiated Instruction
      </h2>
      <p className="text-gray-600 mb-6 leading-relaxed">
        Not every student in your class is at the same level. Math Whiz makes it easy to tailor the
        experience for each learner:
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Target size={24} className="text-blue-600" />}
          title="Assign Focus Topics"
          description="Restrict a student's practice to specific topics or subtopics. If Maria needs multiplication facts but Jayden needs fractions, you can set each one up individually."
          color="blue"
        />
        <FeatureCard
          icon={<ClipboardList size={24} className="text-blue-600" />}
          title="Custom Question Sets"
          description="Upload your own questions and assign them to specific students. Great for test prep, intervention groups, or enrichment activities."
          color="blue"
        />
        <FeatureCard
          icon={<Sparkles size={24} className="text-blue-600" />}
          title="AI-Generated Practice"
          description="Generate topic-specific question batches when you need more material. The AI creates questions that match your curriculum and difficulty preferences."
          color="blue"
        />
        <FeatureCard
          icon={<UserPlus size={24} className="text-blue-600" />}
          title="Flexible Student Access"
          description="Students can join from any device with a class code. No accounts required to start. Works in computer labs, on tablets, or on students' home devices."
          color="blue"
        />
      </div>
    </section>

    {/* Free */}
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Completely Free for Teachers and Students
      </h2>
      <p className="text-gray-600 leading-relaxed">
        Math Whiz is free — no trial periods, no premium tiers, no per-student pricing. Every feature
        described on this page is included at no cost. The{' '}
        <Link to="/about/free-math-practice-app" className="text-blue-600 hover:underline">
          full platform is free
        </Link>{' '}
        because we believe every teacher and student should have access to effective math practice tools,
        regardless of budget. There are no ads, either.
      </p>
    </section>

    <CallToAction />
    <RelatedPages slugs={['standards-aligned-math-app', 'best-math-app-3rd-grade', 'best-math-app-4th-grade', 'common-core-math-app']} />
  </PageWrapper>
);

export default TeacherDashboard;
