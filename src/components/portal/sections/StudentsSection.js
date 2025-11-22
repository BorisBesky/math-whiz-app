import React, { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';

const StudentsSection = ({ students, loading, error, onRefresh }) => {
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => (b.questionsToday || 0) - (a.questionsToday || 0));
  }, [students]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Students</h3>
          <p className="text-sm text-gray-500">Live progress across your roster</p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center space-x-2 px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Student</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Class</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Grade</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Questions</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Accuracy</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-600">Today</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>Loading students...</span>
                  </div>
                </td>
              </tr>
            ) : sortedStudents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No students found yet.
                </td>
              </tr>
            ) : (
              sortedStudents.slice(0, 25).map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium text-gray-900">{student.displayName}</p>
                      {student.email && (
                        <p className="text-xs text-gray-500">{student.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{student.className}</td>
                  <td className="px-4 py-2 text-gray-700">{student.grade}</td>
                  <td className="px-4 py-2 text-gray-900 font-medium">{student.totalQuestions}</td>
                  <td className="px-4 py-2 text-gray-700">{student.accuracy}%</td>
                  <td className="px-4 py-2 text-gray-700">{student.questionsToday}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsSection;
