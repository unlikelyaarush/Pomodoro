import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get or create a user ID from localStorage
 * @returns {string} User ID
 */
export function getOrCreateUserId() {
  const STORAGE_KEY = 'assignment_time_predictor_user_id';
  let userId = localStorage.getItem(STORAGE_KEY);
  
  if (!userId) {
    // Generate a random user ID
    userId = 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(STORAGE_KEY, userId);
  }
  
  return userId;
}

/**
 * Format a date to a readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Calculate days between two dates
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Number of days
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate accuracy multiplier from user's assignment history
 * @param {Array} assignments - Array of assignments with actual_hours and estimated_hours
 * @returns {number} Multiplier (e.g., 1.5 means they take 1.5x longer than estimated)
 */
export function calculateAccuracyMultiplier(assignments) {
  if (!assignments || assignments.length === 0) {
    return 1.0; // Default: no adjustment
  }
  
  // Filter assignments that have both estimated and actual hours
  const completed = assignments.filter(a => 
    a.actual_hours && 
    a.estimated_hours_min && 
    a.completed
  );
  
  if (completed.length === 0) {
    return 1.0;
  }
  
  // Calculate average ratio of actual to estimated
  const ratios = completed.map(a => {
    const avgEstimated = (a.estimated_hours_min + a.estimated_hours_max) / 2;
    return a.actual_hours / avgEstimated;
  });
  
  const avgRatio = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;
  
  // Return multiplier (if they take longer, multiplier > 1)
  return Math.max(0.5, Math.min(2.0, avgRatio)); // Clamp between 0.5 and 2.0
}

/**
 * Calculate type-specific accuracy multiplier from user's assignment history
 * @param {Array} allAssignments - Array of all assignments
 * @param {string} targetType - The assignment type to calculate multiplier for
 * @returns {Object} { multiplier: number, sampleSize: number, typeMultiplier: number }
 */
export function calculateTypeSpecificMultiplier(allAssignments, targetType) {
  if (!allAssignments || allAssignments.length === 0) {
    return { multiplier: 1.0, sampleSize: 0, typeMultiplier: 1.0, overallMultiplier: 1.0 };
  }

  // Filter completed assignments with actual hours
  const completed = allAssignments.filter(a => 
    a && a.actual_hours && 
    a.estimated_hours_min != null && 
    a.completed === true
  );

  if (completed.length === 0) {
    return { multiplier: 1.0, sampleSize: 0, typeMultiplier: 1.0, overallMultiplier: 1.0 };
  }

  // Calculate overall multiplier (all assignment types)
  const overallRatios = completed.map(a => {
    const avgEstimated = (a.estimated_hours_min + a.estimated_hours_max) / 2;
    return a.actual_hours / avgEstimated;
  });
  const overallMultiplier = Math.max(0.5, Math.min(2.0, 
    overallRatios.reduce((sum, r) => sum + r, 0) / overallRatios.length
  ));

  // Calculate type-specific multiplier
  const sameTypeAssignments = completed.filter(a => a.assignment_type === targetType);
  
  let typeMultiplier = overallMultiplier; // Default to overall if no same-type data
  let typeSampleSize = 0;

  if (sameTypeAssignments.length > 0) {
    const typeRatios = sameTypeAssignments.map(a => {
      const avgEstimated = (a.estimated_hours_min + a.estimated_hours_max) / 2;
      return a.actual_hours / avgEstimated;
    });
    typeMultiplier = Math.max(0.5, Math.min(2.0,
      typeRatios.reduce((sum, r) => sum + r, 0) / typeRatios.length
    ));
    typeSampleSize = sameTypeAssignments.length;
  }

  // Weight the type-specific multiplier more if we have enough samples
  // Otherwise, blend with overall multiplier
  const finalMultiplier = typeSampleSize >= 3 
    ? typeMultiplier  // Use type-specific if we have 3+ samples
    : typeSampleSize > 0
    ? (typeMultiplier * 0.7 + overallMultiplier * 0.3)  // Blend if 1-2 samples
    : overallMultiplier;  // Use overall if no same-type data

  // Ensure all values are valid numbers
  return {
    multiplier: typeof finalMultiplier === 'number' && !isNaN(finalMultiplier) ? finalMultiplier : 1.0,
    sampleSize: typeof typeSampleSize === 'number' ? typeSampleSize : 0,
    typeMultiplier: typeof typeMultiplier === 'number' && !isNaN(typeMultiplier) ? typeMultiplier : 1.0,
    overallMultiplier: typeof overallMultiplier === 'number' && !isNaN(overallMultiplier) ? overallMultiplier : 1.0
  };
}
