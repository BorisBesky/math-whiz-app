import React from 'react';
import { BarChart3, CheckCircle, Users, Clock } from 'lucide-react';
import { formatDate, formatTime } from '../../../utils/common_utils';

const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${accent}`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const OverviewSection = ({ stats, students, loadingStudents, loadingClasses, studentError, classError }) => {
  const isLoading = loadingStudents || loadingClasses;

  return (
    <div className="p-6 space-y-6">
      {(studentError || classError) && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3">
          {studentError || classError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Students"
          value={isLoading ? '—' : stats.totalStudents}
          icon={Users}
          accent="bg-blue-600"
        />
        <StatCard
          label="Active Today"
          value={isLoading ? '—' : stats.activeToday}
          icon={CheckCircle}
          accent="bg-green-600"
        />
        <StatCard
          label="Avg. Accuracy"
          value={isLoading ? '—' : `${stats.averageAccuracy}%`}
          icon={BarChart3}
          accent="bg-purple-600"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          {students
            .filter(s => s.latestActivity)
            .sort((a, b) => new Date(b.latestActivity) - new Date(a.latestActivity))
            .slice(0, 10)
            .map(student => (
              <div key={student.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {student.email ? student.email.slice(0, 2).toUpperCase() : (student.id || '').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.email || `Student ${(student.id || '').slice(0, 8)}`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{formatDate(student.latestActivity)}</p>
                  <p className="text-sm text-gray-600">{formatTime(student.latestActivity)}</p>
                </div>
              </div>
            ))}
          {students.filter(s => s.latestActivity).length === 0 && (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          <span>Refreshing data...</span>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
