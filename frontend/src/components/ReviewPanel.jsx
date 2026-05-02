import { useState } from 'react';
import SeverityBadge from './SeverityBadge';

export default function ReviewPanel({ review }) {
  const [expanded, setExpanded] = useState(null);

  if (!review) return null;

  const highCount = review.suggestions?.filter((s) => s.severity === 'high').length || 0;
  const mediumCount = review.suggestions?.filter((s) => s.severity === 'medium').length || 0;
  const lowCount = review.suggestions?.filter((s) => s.severity === 'low').length || 0;

  const scoreColor =
    review.overallScore >= 70
      ? 'text-green-400'
      : review.overallScore >= 40
      ? 'text-yellow-400'
      : 'text-red-400';

  const scoreGradient =
    review.overallScore >= 70
      ? 'from-green-500 to-emerald-400'
      : review.overallScore >= 40
      ? 'from-yellow-500 to-amber-400'
      : 'from-red-500 to-orange-400';

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Score Card */}
      <div className="card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Review Results</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {review.language && review.language !== 'unknown' && (
                <span className="font-mono text-blue-400">{review.language} · </span>
              )}
              {review.suggestions?.length || 0} issues found
            </p>
          </div>
          <div className="text-right">
            <div className={`font-display text-4xl font-bold ${scoreColor}`}>
              {review.overallScore}
            </div>
            <div className="text-gray-600 text-xs">/ 100</div>
          </div>
        </div>

        {/* Score bar */}
        <div className="progress-bar mb-4">
          <div
            className={`progress-fill bg-gradient-to-r ${scoreGradient}`}
            style={{ width: `${review.overallScore}%` }}
          />
        </div>

        {/* Severity counts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-400 font-display">{highCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">High</div>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400 font-display">{mediumCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Medium</div>
          </div>
          <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400 font-display">{lowCount}</div>
            <div className="text-xs text-gray-500 mt-0.5">Low</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card rounded-2xl p-5">
        <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">
          AI Summary
        </h3>
        <p className="text-gray-300 text-sm leading-relaxed">{review.summary}</p>
      </div>

      {/* Suggestions */}
      <div className="card rounded-2xl p-5">
        <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-4">
          Suggestions ({review.suggestions?.length || 0})
        </h3>
        <div className="space-y-3">
          {review.suggestions?.map((s, i) => (
            <div
              key={i}
              className={`suggestion-card suggestion-${s.severity} bg-gray-900/50 rounded-xl overflow-hidden`}
            >
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <SeverityBadge severity={s.severity} />
                      {s.line > 0 && (
                        <span className="text-gray-600 text-xs font-mono">Line {s.line}</span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm leading-snug">{s.issue}</p>
                  </div>
                  <span className="text-gray-600 text-xs shrink-0 mt-1">
                    {expanded === i ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {expanded === i && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400 text-sm shrink-0">✅</span>
                    <p className="text-green-300 text-sm leading-relaxed">{s.suggestion}</p>
                  </div>
                  {s.refactoredCode && (
                    <div className="rounded-xl overflow-hidden border border-gray-700">
                      <div className="bg-gray-800 px-3 py-1.5 text-xs text-gray-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Suggested Fix
                      </div>
                      <pre className="bg-[#060A12] p-3 text-xs text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {s.refactoredCode}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
