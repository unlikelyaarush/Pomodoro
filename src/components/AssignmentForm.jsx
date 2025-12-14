import { useState, useEffect, useMemo } from 'react';
import { calculateTypeSpecificMultiplier } from '../lib/utils';
import { getUserAssignments, saveAssignment } from '../lib/supabase';
import { getTimeEstimate } from '../lib/gemini';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import TimeEstimate from './TimeEstimate';
import PastAssignments from './PastAssignments';

const ASSIGNMENT_TYPES = [
  'Essay',
  'Research Paper',
  'Problem Set',
  'Coding Project',
  'Presentation',
  'Lab Report',
  'Reading Assignment',
  'Study Guide',
  'Creative Project',
  'Group Project'
];

export default function AssignmentForm() {
  const [formData, setFormData] = useState({
    assignment_type: '',
    subject: '',
    details: '',
    page_count: '',
    due_date: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [accuracyMultiplier, setAccuracyMultiplier] = useState(1.0);
  const [allAssignments, setAllAssignments] = useState([]);
  const [currentAssignment, setCurrentAssignment] = useState(null);

  // Load user's assignment history on mount
  const loadUserHistory = async () => {
    try {
      const assignments = await getUserAssignments();
      // Ensure assignments is always an array
      setAllAssignments(Array.isArray(assignments) ? assignments : []);
    } catch (error) {
      console.error('Error loading user history:', error);
      setAllAssignments([]); // Set to empty array on error
      // Don't set error state here - it's not critical for form submission
    }
  };

  useEffect(() => {
    loadUserHistory();
  }, []);

  // Reload history when assignments might have changed (e.g., after logging hours)
  // This ensures multipliers are always up-to-date
  const refreshAssignments = async () => {
    await loadUserHistory();
  };

  // Calculate multiplier using useMemo to avoid recalculating on every render
  const multiplierData = useMemo(() => {
    try {
      if (formData.assignment_type && Array.isArray(allAssignments) && allAssignments.length > 0) {
        return calculateTypeSpecificMultiplier(allAssignments, formData.assignment_type);
      }
      return { multiplier: 1.0, sampleSize: 0, typeMultiplier: 1.0, overallMultiplier: 1.0 };
    } catch (error) {
      console.error('Error calculating multiplier:', error);
      return { multiplier: 1.0, sampleSize: 0, typeMultiplier: 1.0, overallMultiplier: 1.0 };
    }
  }, [formData.assignment_type, allAssignments]);

  // Update accuracy multiplier when multiplierData changes
  useEffect(() => {
    setAccuracyMultiplier(multiplierData.multiplier);
  }, [multiplierData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.assignment_type) {
      setError('Please select an assignment type');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Please enter a subject');
      return false;
    }
    if (!formData.details.trim()) {
      setError('Please provide assignment details');
      return false;
    }
    if (!formData.due_date) {
      setError('Please select a due date');
      return false;
    }
    
    // Check if due date is in the past
    const dueDate = new Date(formData.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      setError('Due date cannot be in the past');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEstimate(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Fetch fresh assignment data before calculating to ensure we have latest completed assignments
      const freshAssignments = await getUserAssignments();
      const safeAssignments = Array.isArray(freshAssignments) ? freshAssignments : [];
      
      // Update state with fresh data
      setAllAssignments(safeAssignments);
      
      // Get type-specific multiplier for this assignment using fresh data
      const multiplierData = calculateTypeSpecificMultiplier(safeAssignments, formData.assignment_type);
      const typeMultiplier = multiplierData.multiplier;
      
      // Filter for completed assignments of the same type to send to Gemini
      const sameTypeCompleted = safeAssignments.filter(a => 
        a && 
        a.assignment_type === formData.assignment_type &&
        a.completed === true &&
        a.actual_hours != null &&
        a.estimated_hours_min != null
      );
      
      // Get time estimate from Gemini with type-specific multiplier and actual historical data
      const estimateData = await getTimeEstimate(formData, typeMultiplier, multiplierData, sameTypeCompleted);
      
      // Validate estimateData structure
      if (!estimateData || !estimateData.totalHours || !estimateData.startDate) {
        throw new Error('Invalid response from AI. Missing required fields. Please try again.');
      }
      
      // Save to database
      const assignmentToSave = {
        assignment_type: formData.assignment_type,
        subject: formData.subject,
        details: formData.details,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        due_date: formData.due_date,
        estimated_hours_min: estimateData.totalHours.min,
        estimated_hours_max: estimateData.totalHours.max,
        breakdown: estimateData.breakdown || [],
        start_date: estimateData.startDate,
        reasoning: estimateData.reasoning || '',
        tips: estimateData.tips || [],
        completed: false
      };

      const { data: savedAssignment, error: saveError } = await saveAssignment(assignmentToSave);
      
      if (saveError) {
        const errorMessage = saveError?.message || saveError?.error_description || String(saveError);
        throw new Error(errorMessage || 'Failed to save assignment');
      }

      if (!savedAssignment) {
        throw new Error('Assignment was not saved properly');
      }

      setEstimate(estimateData);
      setCurrentAssignment(savedAssignment);
      
      // Reload assignments to show the new one (don't await to avoid blocking)
      loadUserHistory().catch(err => {
        console.error('Error reloading assignments:', err);
        // Don't throw - this is not critical
      });
    } catch (err) {
      console.error('Error getting estimate:', err);
      const errorMessage = err?.message || err?.error_description || String(err) || 'Failed to get time estimate. Please try again.';
      setError(errorMessage);
      setEstimate(null);
      setCurrentAssignment(null);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assignment Type */}
        <div>
          <label htmlFor="assignment_type" className="block text-sm font-medium text-gray-300 mb-2">
            Assignment Type *
          </label>
          <select
            id="assignment_type"
            name="assignment_type"
            value={formData.assignment_type}
            onChange={handleChange}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select assignment type...</option>
            {ASSIGNMENT_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., Computer Science, History"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          />
        </div>

        {/* Details */}
        <div>
          <label htmlFor="details" className="block text-sm font-medium text-gray-300 mb-2">
            Assignment Details *
          </label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleChange}
            placeholder="Brief description of the assignment, requirements, topic..."
            rows="4"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Page Count and Due Date (two columns on larger screens) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="page_count" className="block text-sm font-medium text-gray-300 mb-2">
              Page/Question Count
            </label>
            <input
              type="number"
              id="page_count"
              name="page_count"
              value={formData.page_count}
              onChange={handleChange}
              placeholder="e.g., 5, 10"
              min="1"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              min={today}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Accuracy Multiplier Info */}
        {formData.assignment_type && multiplierData && (
          multiplierData.sampleSize > 0 && multiplierData.multiplier != null ? (
            <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-3 text-sm text-purple-200">
              <span className="font-semibold">Note:</span> Based on {multiplierData.sampleSize} past {formData.assignment_type.toLowerCase()}{multiplierData.sampleSize === 1 ? '' : 's'}, 
              {' '}we've adjusted estimates by {(multiplierData.multiplier || 1.0).toFixed(2)}x to match your working style.
            </div>
          ) : multiplierData.overallMultiplier != null && multiplierData.overallMultiplier !== 1.0 ? (
            <div className="bg-purple-900/30 border border-purple-600 rounded-lg p-3 text-sm text-purple-200">
              <span className="font-semibold">Note:</span> Based on your past assignments, we've adjusted estimates by {(multiplierData.overallMultiplier || 1.0).toFixed(2)}x to match your working style.
            </div>
          ) : null
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Calculating...
            </>
          ) : (
            'Get Time Estimate'
          )}
        </button>
      </form>

      {/* Error Message */}
      <ErrorMessage message={error} onDismiss={() => setError(null)} />

      {/* Loading Spinner */}
      {loading && <LoadingSpinner />}

      {/* Results */}
      {estimate && <TimeEstimate estimate={estimate} dueDate={formData.due_date} />}

      {/* Past Assignments */}
      {Array.isArray(allAssignments) && (
        <PastAssignments 
          assignments={allAssignments} 
          onUpdate={refreshAssignments}
        />
      )}
    </div>
  );
}
