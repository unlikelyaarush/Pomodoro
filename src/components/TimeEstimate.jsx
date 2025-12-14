import { formatDate, daysBetween } from '../lib/utils';

export default function TimeEstimate({ estimate, dueDate }) {
  if (!estimate) return null;

  const daysUntilStart = daysBetween(new Date(), estimate.startDate);

  return (
    <div className="space-y-6 mt-8 animate-fade-in">
      {/* Total Time Estimate */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-center">
        <p className="text-purple-100 text-sm mb-2">Total Time Estimate</p>
        <h2 className="text-4xl font-bold text-white">
          {estimate.totalHours.min}-{estimate.totalHours.max} hours
        </h2>
      </div>

      {/* Phase Breakdown */}
      {estimate.breakdown && estimate.breakdown.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-purple-300">Time Breakdown</h3>
          <div className="space-y-3">
            {estimate.breakdown.map((phase, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <span className="text-gray-300">{phase.phase}</span>
                <span className="text-purple-400 font-semibold">{phase.hours} hours</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Date Warning */}
      <div className="bg-red-900/20 border-2 border-red-600 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-red-400 font-semibold text-lg mb-2">Recommended Start Date</h3>
            <p className="text-red-300 text-2xl font-bold mb-2">
              {formatDate(estimate.startDate)}
            </p>
            <p className="text-red-200 text-sm">
              {daysUntilStart > 0 
                ? `That's ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''} from now`
                : daysUntilStart === 0
                ? 'That\'s today! Start now!'
                : `That was ${Math.abs(daysUntilStart)} day${Math.abs(daysUntilStart) !== 1 ? 's' : ''} ago - you should have started already!`
              }
            </p>
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      {estimate.reasoning && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-3 text-purple-300">Why This Estimate?</h3>
          <p className="text-gray-300 leading-relaxed">{estimate.reasoning}</p>
        </div>
      )}

      {/* Pro Tips */}
      {estimate.tips && estimate.tips.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-purple-300">Pro Tips</h3>
          <ul className="space-y-2">
            {estimate.tips.map((tip, index) => (
              <li key={index} className="flex items-start text-gray-300">
                <span className="text-purple-400 mr-2">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
