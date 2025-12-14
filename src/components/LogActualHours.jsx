import { useState } from 'react';
import { updateAssignment } from '../lib/supabase';
import ErrorMessage from './ErrorMessage';

export default function LogActualHours({ assignment, onSuccess, onCancel }) {
  const [actualHours, setActualHours] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const hours = parseFloat(actualHours);
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid number of hours (greater than 0)');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to update assignment:', {
        id: assignment.id,
        idType: typeof assignment.id,
        assignment: assignment
      });

      const { data: updatedAssignment, error: updateError } = await updateAssignment(assignment.id, {
        actual_hours: hours,
        completed: true,
        completed_at: new Date().toISOString(),
      });

      if (updateError) {
        console.error('Update error details:', updateError);
        console.error('Update error message:', updateError?.message);
        throw updateError;
      }

      if (!updatedAssignment) {
        throw new Error('Update completed but no assignment data was returned');
      }

      console.log('Assignment updated successfully:', updatedAssignment);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error updating assignment:', err);
      setError(err.message || 'Failed to save actual hours. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-purple-600 animate-fade-in">
      <h3 className="text-xl font-semibold mb-4 text-purple-300">
        Log Actual Time Spent
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        How many hours did you actually spend on this assignment? This helps improve future estimates.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="actual_hours" className="block text-sm font-medium text-gray-300 mb-2">
            Actual Hours Spent
          </label>
          <input
            type="number"
            id="actual_hours"
            value={actualHours}
            onChange={(e) => setActualHours(e.target.value)}
            placeholder="e.g., 12.5"
            step="0.5"
            min="0.5"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
          <p className="text-gray-500 text-xs mt-1">
            Estimated: {assignment.estimated_hours_min}-{assignment.estimated_hours_max} hours
          </p>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError(null)} />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
