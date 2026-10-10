import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

/**
 * Advisory banner that warns a teacher when a class is over-repeating questions in some
 * topic/subtopic (signal that the question pool is too small). Each flag offers a CTA to
 * add questions — wired by the parent via onAddQuestions(flag), typically navigating to
 * the Question Bank where AI generation and import live.
 *
 * Renders nothing when there are no flags, so it is safe to mount unconditionally.
 */
const QuestionPoolHealthBanner = ({ flags = [], onAddQuestions, className = '' }) => {
  if (!flags || flags.length === 0) return null;

  return (
    <div
      className={`bg-amber-50 border border-amber-200 text-amber-900 rounded-button p-4 ${className}`}
      role="status"
    >
      <div className="flex items-start space-x-2">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">Students are repeating questions</p>
            <span className="flex-shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 tabular-nums">
              {flags.length} {flags.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
          <p className="text-sm text-amber-800 mt-0.5">
            These topics have too few distinct questions, so students keep seeing the same ones.
            Add more by generating with AI or importing questions.
          </p>

          {/* Bounded so a long list of flags can't take over the class detail
              modal; the header and explanation above stay visible. */}
          <ul
            className="mt-3 space-y-2 max-h-48 sm:max-h-64 overflow-y-auto overscroll-contain pr-1 rounded-button focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Topics with repeated questions"
            tabIndex={0}
            data-testid="question-pool-health-list"
          >
            {flags.map((flag) => {
              const label = flag.subtopic
                ? `${flag.topic} — ${flag.subtopic}`
                : flag.topic;
              return (
                <li
                  key={`${flag.topic}|||${flag.subtopic || ''}`}
                  className="flex items-center justify-between gap-3 bg-white/60 rounded-button px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {label}
                      {flag.severity === 'high' && (
                        <span className="ml-2 text-xs font-semibold uppercase text-red-700">high</span>
                      )}
                    </p>
                    <p className="text-xs text-amber-700 truncate">
                      seen up to {flag.maxRepeats}× · {flag.distinctQuestions} distinct
                      {flag.sampleQuestion ? ` · e.g. "${flag.sampleQuestion}"` : ''}
                    </p>
                  </div>
                  {onAddQuestions && (
                    <button
                      type="button"
                      onClick={() => onAddQuestions(flag)}
                      className="flex-shrink-0 inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-button focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      Add questions
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestionPoolHealthBanner;
