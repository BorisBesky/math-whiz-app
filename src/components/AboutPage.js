import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart2,
  Sparkles,
  PenTool,
  Target,
  ClipboardList,
  UserPlus,
  ArrowLeft,
  Star,
  Brain,
  Gamepad2,
  Trophy,
} from 'lucide-react';

const AboutPage = () => {
  useEffect(() => {
    document.title = 'About Math Whiz — Adaptive Math Practice for 3rd & 4th Graders';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Learn how Math Whiz helps students practice math with adaptive questions, rewards, and drawing tools — and how teachers can create classes, track progress, and add custom content.');
    }

    // Structured data for search engines
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Math Whiz',
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      description: 'Free adaptive math practice platform for 3rd and 4th graders with teacher dashboards, custom content, and AI question generation.',
      educationalLevel: ['3rd Grade', '4th Grade'],
      audience: {
        '@type': 'EducationalAudience',
        educationalRole: ['student', 'teacher', 'parent'],
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Adaptive difficulty',
        'Drawing canvas for showing work',
        'Coin rewards system',
        'Teacher class management',
        'Custom question sets',
        'AI question generation',
        'Real-time student analytics',
        'Common Core aligned',
      ],
    });
    document.head.appendChild(script);

    return () => {
      document.title = 'Math Whiz — Adaptive Math Practice for 3rd & 4th Graders';
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to App</span>
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
          Math Whiz
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          An interactive math practice platform for 3rd and 4th graders — built for students who
          want to level up and teachers who want real insight into how their students are doing.
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-20">

        {/* ───── FOR STUDENTS ───── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-green-100 rounded-xl">
              <Gamepad2 size={28} className="text-green-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">For Students</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Brain size={24} className="text-green-600" />}
              title="Adaptive Practice"
              description="Questions automatically adjust to your level. The more you practice, the smarter the app gets at finding the right challenge for you."
              color="green"
            />
            <FeatureCard
              icon={<PenTool size={24} className="text-green-600" />}
              title="Draw Your Work"
              description="Use the built-in sketch pad to show your work — draw arrays, number lines, area models, and more right on screen."
              color="green"
            />
            <FeatureCard
              icon={<Trophy size={24} className="text-green-600" />}
              title="Earn Coins & Rewards"
              description="Every correct answer earns coins. Spend them in the store to unlock fun backgrounds and customize your experience."
              color="green"
            />
            <FeatureCard
              icon={<Star size={24} className="text-green-600" />}
              title="Learn From Mistakes"
              description="Get clear, step-by-step explanations when you miss a question so you understand the concept, not just the answer."
              color="green"
            />
            <FeatureCard
              icon={<BarChart2 size={24} className="text-green-600" />}
              title="Track Your Progress"
              description="Your personal dashboard shows accuracy, streaks, and growth across every topic so you can see how far you've come."
              color="green"
            />
            <FeatureCard
              icon={<BookOpen size={24} className="text-green-600" />}
              title="Covers Real Curriculum"
              description="Topics align with Common Core standards for 3rd and 4th grade — multiplication, division, fractions, geometry, and more."
              color="green"
            />
          </div>
        </section>

        {/* ───── FOR TEACHERS, PARENTS & TUTORS ───── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 rounded-xl">
              <GraduationCap size={28} className="text-blue-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              For Teachers, Parents & Tutors
            </h2>
          </div>

          <p className="text-gray-600 mb-8 text-lg max-w-3xl">
            Any teacher, parent, or tutor can create a class and invite students in minutes.
            There's nothing to install — just sign up, set up your class, and share the join code.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <FeatureCard
              icon={<Users size={24} className="text-blue-600" />}
              title="Create a Class Instantly"
              description="Set up a class, generate an invite code, and have your students join from any device. Works for classrooms, homeschool groups, and one-on-one tutoring."
              color="blue"
            />
            <FeatureCard
              icon={<BarChart2 size={24} className="text-blue-600" />}
              title="Live Student Analytics"
              description="See every student's accuracy, time spent, and topic-by-topic performance in real time. Identify who needs help before they fall behind."
              color="blue"
            />
            <FeatureCard
              icon={<Target size={24} className="text-blue-600" />}
              title="Per-Student Focus Areas"
              description="Assign specific topics or subtopics to individual students. If one student struggles with fractions while another needs division practice, you can tailor the experience for each."
              color="blue"
            />
            <FeatureCard
              icon={<ClipboardList size={24} className="text-blue-600" />}
              title="Custom Content"
              highlight
              description="Upload your own test materials, worksheets, and practice problems. Preparing students for an upcoming exam? Add the exact questions they need to practice — the AI can even generate similar questions in bulk."
              color="blue"
            />
            <FeatureCard
              icon={<Sparkles size={24} className="text-blue-600" />}
              title="AI Question Generation"
              description="Generate batches of curriculum-aligned questions with one click. Choose the topic, subtopic, and difficulty — the AI handles the rest."
              color="blue"
            />
            <FeatureCard
              icon={<UserPlus size={24} className="text-blue-600" />}
              title="Simple Student Onboarding"
              description="Students join with a class code — no email required. They can start as guests and create accounts later to save progress."
              color="blue"
            />
          </div>

          {/* Custom content callout */}
          <div className="mt-10 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Your Materials, Their Practice
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Math Whiz isn't one-size-fits-all. Teachers can add custom question sets drawn from
              their own curriculum, textbooks, or upcoming tests. Assign different material to
              different students based on what each one needs to work on. Whether you're a classroom
              teacher prepping 30 students for a state test or a parent helping one child master
              long division, the platform adapts to your goals.
            </p>
          </div>
        </section>

        {/* ───── CTA ───── */}
        <section className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to start?</h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Students can jump in as guests instantly. Teachers can create a free account and set up
            a class in under two minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/student-login?guest=true"
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition shadow-sm"
            >
              Try as Student
            </Link>
            <Link
              to="/teacher-login?mode=signup"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm"
            >
              Sign Up as Teacher
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

function FeatureCard({ icon, title, description, color, highlight }) {
  const borderColor = color === 'blue' ? 'border-blue-200' : 'border-green-200';
  const bgHighlight = highlight
    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-300'
    : 'bg-white';

  return (
    <div
      className={`${bgHighlight} border ${borderColor} rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-1">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <p className="mt-1 text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
