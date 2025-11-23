import React from 'react';
import { BarChart3, CheckCircle, Users } from 'lucide-react';

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

const OverviewSection = ({ stats, loadingStudents, loadingClasses, studentError, classError }) => {
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
