/**
 * Get time estimate from Gemini API
 * @param {Object} assignmentData - Assignment details
 * @param {number} accuracyMultiplier - User's personal accuracy multiplier
 * @param {Object} multiplierData - Type-specific multiplier data (optional)
 * @param {Array} completedAssignments - Array of completed assignments of the same type (optional)
 * @returns {Promise<Object>} Time estimate with breakdown
 */
export async function getTimeEstimate(assignmentData, accuracyMultiplier = 1.0, multiplierData = null, completedAssignments = []) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = buildPrompt(assignmentData, accuracyMultiplier, multiplierData, completedAssignments);
  
  // Try different model names and API versions
  // Note: Free tier availability may vary. Try these in order:
  const modelConfigs = [
    { model: 'gemini-2.0-flash', version: 'v1beta', useQueryKey: false },
    { model: 'gemini-2.0-flash', version: 'v1beta', useQueryKey: true },
    { model: 'gemini-1.5-flash', version: 'v1', useQueryKey: false },
    { model: 'gemini-1.5-flash', version: 'v1', useQueryKey: true },
    { model: 'gemini-pro', version: 'v1beta', useQueryKey: false },
  ];
  
  let lastError = null;
  
  for (const config of modelConfigs) {
    try {
      // Build URL - use query parameter or header for API key
      let apiUrl = `https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent`;
      if (config.useQueryKey) {
        apiUrl += `?key=${apiKey}`;
      }
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add API key to header if not using query parameter
      if (!config.useQueryKey) {
        headers['x-goog-api-key'] = apiKey;
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API error: ${response.status}`;
        
        // If model not found, try next config
        if (errorMessage.includes('not found') || errorMessage.includes('not supported') || errorMessage.includes('not available')) {
          console.log(`Model ${config.model} not available with ${config.version}, trying next...`);
          lastError = new Error(`Model ${config.model} not available with ${config.version}`);
          continue; // Try next model
        }
        
        // Provide user-friendly messages for common errors
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          throw new Error('API quota exceeded. Please check your Google Cloud billing plan or wait for the quota to reset.');
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('No response from Gemini API');
      }

      // Parse JSON from response (may be wrapped in markdown code blocks)
      const jsonText = extractJsonFromText(text);
      const estimate = JSON.parse(jsonText);

      return estimate; // Success! Return the estimate
      
    } catch (error) {
      // If this is the last config, throw the error
      if (config === modelConfigs[modelConfigs.length - 1]) {
        console.error('All model configurations failed. Last error:', error);
        throw lastError || error;
      }
      // Otherwise, continue to next config
      lastError = error;
      continue;
    }
  }
  
  // If we get here, all configs failed
  const finalError = lastError || new Error('Failed to connect to Gemini API');
  throw new Error(
    `${finalError.message}. ` +
    `All model configurations failed. ` +
    `Please check: 1) Your API key is valid, 2) You have access to Gemini models in your Google Cloud account, ` +
    `3) Your billing/quota settings allow API usage. ` +
    `You may need to enable billing or check your Google Cloud Console for available models.`
  );
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(assignmentData, accuracyMultiplier, multiplierData = null, completedAssignments = []) {
  const { assignment_type, subject, details, page_count, due_date } = assignmentData;
  
  // Filter for same-type completed assignments
  const sameTypeCompleted = completedAssignments.filter(a => 
    a && 
    a.assignment_type === assignment_type &&
    a.completed === true &&
    a.actual_hours != null &&
    a.estimated_hours_min != null
  );

  let historicalDataSection = '';
  let minActualHours = null;
  let maxActualHours = null;
  let avgActualHours = null;
  
  if (sameTypeCompleted.length > 0) {
    // Calculate statistics from historical data
    const actualHours = sameTypeCompleted.map(a => a.actual_hours);
    avgActualHours = actualHours.reduce((sum, h) => sum + h, 0) / actualHours.length;
    minActualHours = Math.min(...actualHours);
    maxActualHours = Math.max(...actualHours);
    
    const pageCounts = sameTypeCompleted.map(a => a.page_count).filter(p => p != null);
    const avgPageCount = pageCounts.length > 0 
      ? pageCounts.reduce((sum, p) => sum + p, 0) / pageCounts.length 
      : null;
    
    // Calculate hours per page if we have page data
    let hoursPerPage = null;
    if (avgPageCount && avgPageCount > 0) {
      hoursPerPage = avgActualHours / avgPageCount;
    }

    historicalDataSection = `\n\nUSER'S PAST ${assignment_type.toUpperCase()} ASSIGNMENTS - USE THIS DATA FOR CONSISTENT PREDICTIONS:
`;
    
    sameTypeCompleted.forEach((assignment, index) => {
      const avgEstimated = (assignment.estimated_hours_min + assignment.estimated_hours_max) / 2;
      const ratio = assignment.actual_hours / avgEstimated;
      const hoursPerPageForThis = assignment.page_count && assignment.page_count > 0 
        ? (assignment.actual_hours / assignment.page_count).toFixed(2)
        : 'N/A';
      
      historicalDataSection += `
Past Assignment ${index + 1}:
- Subject: ${assignment.subject || 'N/A'}
- Description: ${(assignment.details || '').substring(0, 100)}${(assignment.details || '').length > 100 ? '...' : ''}
- Page/Question Count: ${assignment.page_count || 'N/A'}
- Estimated: ${assignment.estimated_hours_min}-${assignment.estimated_hours_max} hours (avg: ${avgEstimated.toFixed(1)})
- ACTUAL TIME SPENT: ${assignment.actual_hours} hours
- Hours per page: ${hoursPerPageForThis}
- Ratio (Actual/Estimated): ${ratio.toFixed(2)}x
`;
    });

    historicalDataSection += `\nSTATISTICAL SUMMARY:
- Number of completed ${assignment_type.toLowerCase()}s: ${sameTypeCompleted.length}
- Average actual time: ${avgActualHours.toFixed(1)} hours
- Range: ${minActualHours.toFixed(1)} - ${maxActualHours.toFixed(1)} hours
${avgPageCount ? `- Average page count: ${avgPageCount.toFixed(1)} pages` : ''}
${hoursPerPage ? `- Average hours per page: ${hoursPerPage.toFixed(2)} hours/page` : ''}
- Average ratio (actual/estimated): ${(sameTypeCompleted.reduce((sum, a) => {
      const avgEst = (a.estimated_hours_min + a.estimated_hours_max) / 2;
      return sum + (a.actual_hours / avgEst);
    }, 0) / sameTypeCompleted.length).toFixed(2)}x

CRITICAL PREDICTION METHOD (MUST FOLLOW FOR CONSISTENCY):
1. PRIMARY: Use the statistical averages above as your baseline
   - If new assignment has ${page_count || 'N/A'} pages and average is ${avgPageCount ? avgPageCount.toFixed(1) : 'N/A'} pages:
     ${hoursPerPage ? `  → Calculate: ${page_count || 'N/A'} pages × ${hoursPerPage.toFixed(2)} hours/page = ${((parseFloat(page_count) || avgPageCount) * hoursPerPage).toFixed(1)} hours baseline` : '  → Use average actual time as baseline'}
   - If no page count, use average actual time: ${avgActualHours.toFixed(1)} hours as baseline

2. ADJUST for differences:
   - Compare new assignment description with past ones
   - If more complex/detailed: add 10-20%
   - If simpler: subtract 10-20%
   - If similar complexity: keep baseline

3. CONSISTENCY CHECK:
   - Your estimate should be within the range: ${minActualHours.toFixed(1)} - ${maxActualHours.toFixed(1)} hours (unless significantly different in size/complexity)
   - If your estimate is outside this range, explain why in your reasoning

4. FINAL ESTIMATE:
   - Start from the calculated baseline
   - Apply adjustments for complexity differences
   - Add 10-15% buffer for unexpected issues
   - Ensure consistency with past assignments
`;
  }

  let accuracyContext = '';
  if (multiplierData && multiplierData.sampleSize > 0 && multiplierData.typeMultiplier != null) {
    const typeMult = multiplierData.typeMultiplier || 1.0;
    accuracyContext = `User's Historical Pattern: Based on ${multiplierData.sampleSize} completed ${assignment_type.toLowerCase()}${multiplierData.sampleSize === 1 ? '' : 's'}, this student takes ${typeMult.toFixed(2)}x longer than estimated. `;
    if (multiplierData.overallMultiplier != null && multiplierData.overallMultiplier !== typeMult) {
      accuracyContext += `Overall, across all assignment types, they take ${(multiplierData.overallMultiplier || 1.0).toFixed(2)}x longer. `;
    }
  } else {
    const safeMultiplier = accuracyMultiplier != null && typeof accuracyMultiplier === 'number' ? accuracyMultiplier : 1.0;
    accuracyContext = `User's Historical Pattern: This student historically takes ${safeMultiplier.toFixed(2)}x longer than their initial estimates. Factor this into your calculation.`;
  }
  
  return `You are an academic time management advisor helping students get REALISTIC time estimates for their assignments. Students typically underestimate by 40-60%, so be honest and add buffer time.

NEW ASSIGNMENT DETAILS:
- Type: ${assignment_type}
- Subject: ${subject}
- Description: ${details}
- Page/Question Count: ${page_count || 'Not specified'}
- Due Date: ${due_date}

${historicalDataSection}

${accuracyContext}

CRITICAL INSTRUCTIONS:
${sameTypeCompleted.length > 0 && minActualHours != null && maxActualHours != null ? `
1. MANDATORY: Follow the "CRITICAL PREDICTION METHOD" above. Use the statistical averages and calculations provided.
2. CONSISTENCY IS KEY: Your estimate must be consistent with past assignments. If past ${assignment_type.toLowerCase()}s took ${minActualHours.toFixed(1)}-${maxActualHours.toFixed(1)} hours, your estimate should be in that range unless the new assignment is significantly different.
3. Use the calculated baseline from the statistical summary, then adjust only for meaningful differences.
4. Consider all phases: research, planning, writing/coding, revision, breaks, distractions.
5. Add 10-15% buffer for unexpected issues (not 20-30% since we're using actual data).
6. Calculate when they should START (assuming 2-4 hours of productive work per day).
7. Provide specific, actionable tips for this assignment type.
8. In your reasoning, explain:
   - Which statistical baseline you used (average time, hours per page calculation, etc.)
   - How you adjusted for differences from past assignments
   - Why your estimate is consistent with past ${assignment_type.toLowerCase()}s
` : `
1. Be REALISTIC, not optimistic. Add 20-30% buffer time on top of base estimates.
2. Consider all phases: research, planning, writing/coding, revision, breaks, distractions.
3. Account for the assignment type complexity.
4. Factor in the user's accuracy multiplier (${(accuracyMultiplier != null && typeof accuracyMultiplier === 'number' ? accuracyMultiplier : 1.0).toFixed(2)}x).
5. Calculate when they should START (assuming 2-4 hours of productive work per day).
6. Provide specific, actionable tips for this assignment type.
`}

Return your response as a JSON object with this EXACT structure:
{
  "totalHours": {
    "min": <minimum hours>,
    "max": <maximum hours>
  },
  "breakdown": [
    {
      "phase": "<phase name>",
      "hours": <hours for this phase>
    }
  ],
  "startDate": "<YYYY-MM-DD>",
  "reasoning": "<2-3 sentences explaining why you gave this estimate>",
  "tips": [
    "<tip 1>",
    "<tip 2>",
    "<tip 3>"
  ]
}

Only return the JSON, no other text.`;
}

/**
 * Extract JSON from text (handles markdown code blocks)
 */
function extractJsonFromText(text) {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1];
  }
  
  // Try to find JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  // If no JSON found, throw error
  throw new Error('No valid JSON found in response');
}
