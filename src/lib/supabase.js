import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Some features may not work.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
  if (!supabase) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Exception getting current user:', error);
    return null;
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

/**
 * Save an assignment to the database
 * @param {Object} assignmentData - Assignment data to save (user_id will be set automatically)
 * @returns {Promise<Object>} Saved assignment or error
 */
export async function saveAssignment(assignmentData) {
  if (!supabase) {
    console.error('Supabase not initialized');
    return { error: 'Database not configured' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: 'User not authenticated' };
  }

  try {
    const assignmentToInsert = { ...assignmentData, user_id: user.id };
    console.log('Saving assignment with user_id:', user.id);
    
    const { data, error } = await supabase
      .from('assignments')
      .insert([assignmentToInsert])
      .select();

    if (error) {
      console.error('Error inserting assignment:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    // Handle the response - Supabase insert with select returns an array
    if (!data) {
      console.error('No data returned from insert. This may be an RLS policy issue.');
      throw new Error('Assignment was inserted but no data was returned. Check RLS policies.');
    }

    // Return the first item if array, or the data itself
    const savedData = Array.isArray(data) 
      ? (data.length > 0 ? data[0] : null)
      : data;
    
    if (!savedData) {
      console.error('Saved data is null or empty');
      throw new Error('Assignment was inserted but no assignment data was returned. This may be an RLS policy issue.');
    }
    
    console.log('Assignment saved successfully with ID:', savedData.id);
    return { data: savedData, error: null };
  } catch (error) {
    console.error('Error saving assignment:', error);
    // Return a proper error object
    const errorMessage = error?.message || error?.error_description || error?.hint || String(error) || 'Unknown error occurred';
    return { data: null, error: new Error(errorMessage) };
  }
}

/**
 * Get all assignments for the current authenticated user
 * @returns {Promise<Array>} Array of assignments
 */
export async function getUserAssignments() {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return [];
  }

  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

/**
 * Get assignments by type for the current user
 * @param {string} assignmentType - Assignment type to filter by
 * @returns {Promise<Array>} Array of assignments
 */
export async function getAssignmentsByType(assignmentType) {
  if (!supabase) {
    return [];
  }

  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('assignment_type', assignmentType)
      .eq('completed', true)
      .not('actual_hours', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assignments by type:', error);
    return [];
  }
}

/**
 * Update an assignment (e.g., mark as completed, add actual hours)
 * @param {string} assignmentId - Assignment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated assignment or error
 */
export async function updateAssignment(assignmentId, updates) {
  if (!supabase) {
    console.error('Supabase not initialized');
    return { error: 'Database not configured' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: 'User not authenticated' };
  }

  if (!assignmentId) {
    return { error: 'Assignment ID is required' };
  }

  try {
    console.log('Updating assignment:', {
      assignmentId,
      assignmentIdType: typeof assignmentId,
      userId: user.id,
      updates
    });

    // Try the update directly - RLS will block if user doesn't own it
    // First verify we can see the assignment (RLS will filter automatically)
    const { data: checkData, error: checkError } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .maybeSingle(); // Use maybeSingle() instead of single() - returns null if not found instead of error

    if (checkError) {
      console.error('Error checking assignment existence:', checkError);
      return { error: checkError };
    }

    if (!checkData) {
      // Assignment doesn't exist or RLS is blocking access
      // Get user's assignments for debugging
      const { data: userAssignments } = await supabase
        .from('assignments')
        .select('id, assignment_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      console.error('Assignment not found or access denied:', {
        searchedId: assignmentId,
        userHasAssignments: userAssignments?.length || 0,
        userAssignmentIds: userAssignments?.map(a => a.id) || []
      });
      
      return { 
        error: new Error(`Assignment with ID ${assignmentId} not found or you don't have permission to update it. Please refresh the page and try again.`)
      };
    }

    // Now perform the update (RLS will ensure only user's own assignments can be updated)
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select();

    if (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
    
    // Handle the response - it should be an array
    if (!data) {
      throw new Error('Update completed but no data was returned');
    }

    // Return the first item if array, or the data itself
    const updatedData = Array.isArray(data) 
      ? (data.length > 0 ? data[0] : null)
      : data;
    
    if (!updatedData) {
      throw new Error('Assignment update succeeded but no assignment data was returned');
    }
    
    return { data: updatedData, error: null };
  } catch (error) {
    console.error('Error updating assignment:', error);
    // Return a proper error object
    const errorMessage = error?.message || error?.error_description || String(error) || 'Unknown error occurred';
    return { data: null, error: new Error(errorMessage) };
  }
}
