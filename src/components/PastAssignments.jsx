import { useState } from 'react';
import { formatDate } from '../lib/utils';
import { updateAssignment } from '../lib/supabase';
import LogActualHours from './LogActualHours';

export default function PastAssignments({ assignments = [], onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending'

  if (!Array.isArray(assignments)) {
    return null;
  }

  const filteredAssignments = assignments.filter(a => {
    if (!a) return false;
    if (filter === 'completed') return a.completed === true;
    if (filter === 'pending') return a.completed !== true;
    return true;
  });

  const handleLogHours = async () => {
    if (onUpdate) {
      await onUpdate();
    }
    setEditingId(null);
  };

  if (assignments.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
        <p>No assignments yet. Create your first estimate above!</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-300">Your Assignments</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className={`bg-gray-800 rounded-lg p-6 border ${
              assignment.completed
                ? 'border-green-600/50'
                : 'border-gray-700'
            }`}
          >
            {editingId === assignment.id ? (
              <LogActualHours
                assignment={assignment}
                onSuccess={handleLogHours}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {assignment.assignment_type}
                    </h3>
                    <p className="text-gray-400 text-sm">{assignment.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-semibold">
                      {assignment.estimated_hours_min}-{assignment.estimated_hours_max} hrs
                    </p>
                    {assignment.actual_hours && (
                      <p className="text-green-400 text-sm">
                        Actual: {assignment.actual_hours} hrs
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">Due:</span>{' '}
                    <span className="text-gray-300">{formatDate(assignment.due_date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Start:</span>{' '}
                    <span className="text-gray-300">{formatDate(assignment.start_date)}</span>
                  </div>
                </div>

                {assignment.completed && assignment.actual_hours && (
                  <div className="mb-4 p-3 bg-green-900/20 border border-green-600/50 rounded-lg">
                    <p className="text-green-300 text-sm">
                      <span className="font-semibold">Completed!</span> You spent {assignment.actual_hours} hours
                      {assignment.estimated_hours_min && (
                        <> (estimated: {(assignment.estimated_hours_min + assignment.estimated_hours_max) / 2} hrs)</>
                      )}
                    </p>
                  </div>
                )}

                {!assignment.completed && (
                  <button
                    onClick={() => setEditingId(assignment.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Mark as Completed & Log Actual Hours
                  </button>
                )}

                {assignment.completed && !assignment.actual_hours && (
                  <button
                    onClick={() => setEditingId(assignment.id)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Log Actual Hours
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
