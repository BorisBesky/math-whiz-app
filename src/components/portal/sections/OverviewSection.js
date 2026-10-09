import React, { useMemo } from 'react';
import { BarChart3, CheckCircle, Users, Clock, ListChecks, LifeBuoy } from 'lucide-react';
import { formatDate, formatTime } from '../../../utils/common_utils';
import { getStudentDisplayName } from '../../../utils/studentName';
import { Alert, Avatar, EmptyState, SectionCard } from '../PortalUI';

const StatCard = ({ label, value, hint, icon: Icon, accent }) => (
  <SectionCard className="p-5 flex items-center gap-4">
    <span className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${accent}`}>
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-gray-400 truncate">{hint}</p>}
    </div>
  </SectionCard>
);

const accuracyTone = (accuracy) => {
  if (accuracy >= 80) return 'bg-green-50 text-green-700 ring-green-600/20';
  if (accuracy >= 60) return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  return 'bg-red-50 text-red-700 ring-red-600/20';
};

const NEEDS_SUPPORT_MIN_QUESTIONS = 20;
const NEEDS_SUPPORT_ACCURACY = 60;

const OverviewSection = ({ stats, students, loadingStudents, loadingClasses, studentError, classError }) => {
  const isLoading = loadingStudents || loadingClasses;

  const recentStudents = useMemo(() => (
    students
      .filter((s) => s.latestActivity)
      .sort((a, b) => new Date(b.latestActivity) - new Date(a.latestActivity))
      .slice(0, 8)
  ), [students]);

  const needsSupport = useMemo(() => (
    students
      .filter((s) => Number(s.totalQuestions) >= NEEDS_SUPPORT_MIN_QUESTIONS && Number(s.accuracy) < NEEDS_SUPPORT_ACCURACY)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)
  ), [students]);

  const totalQuestions = Number(stats.totalQuestions || 0);

  return (
    <div className="space-y-6">
      {(studentError || classError) && (
        <Alert>{studentError || classError}</Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={isLoading ? '—' : stats.totalStudents}
          icon={Users}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Active Today"
          value={isLoading ? '—' : stats.activeToday}
          hint={!isLoading && stats.totalStudents > 0
            ? `${Math.round((stats.activeToday / stats.totalStudents) * 100)}% of roster`
            : undefined}
          icon={CheckCircle}
          accent="bg-green-50 text-green-600"
        />
        <StatCard
          label="Avg. Accuracy"
          value={isLoading ? '—' : `${stats.averageAccuracy}%`}
          icon={BarChart3}
          accent="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Questions Answered"
          value={isLoading ? '—' : totalQuestions.toLocaleString()}
          icon={ListChecks}
          accent="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" aria-hidden="true" />
              Recent Activity
            </h3>
            {isLoading && (
              <span className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" aria-hidden="true" />
                Refreshing data...
              </span>
            )}
          </div>
          {recentStudents.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Clock}
                title="No recent activity"
                description="When students answer questions, their latest sessions will show up here."
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentStudents.map((student) => (
                <li key={student.id} className="px-5 py-3 grid grid-cols-[auto,1fr,auto] items-center gap-3">
                  <Avatar name={getStudentDisplayName(student)} seed={student.id} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{getStudentDisplayName(student)}</p>
                    {student.className && (
                      <p className="text-xs text-gray-500 truncate">{student.className}</p>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="text-sm text-gray-900">{formatDate(student.latestActivity)}</p>
                    <p className="text-xs text-gray-500">{formatTime(student.latestActivity)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard>
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center">
              <LifeBuoy className="w-5 h-5 mr-2 text-amber-600" aria-hidden="true" />
              Could Use Support
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Below {NEEDS_SUPPORT_ACCURACY}% accuracy after {NEEDS_SUPPORT_MIN_QUESTIONS}+ questions
            </p>
          </div>
          {needsSupport.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-500">
              {isLoading ? 'Checking roster...' : 'Everyone is on track right now.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {needsSupport.map((student) => (
                <li key={student.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={getStudentDisplayName(student)} seed={student.id} size="sm" />
                    <p className="text-sm font-medium text-gray-900 truncate">{getStudentDisplayName(student)}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset tabular-nums ${accuracyTone(student.accuracy)}`}>
                    {student.accuracy}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
};

export default OverviewSection;
