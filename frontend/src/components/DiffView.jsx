export default function DiffView({ originalCode, refactoredCode }) {
  if (!originalCode || !refactoredCode) return null;

  const originalLines = originalCode.split('\n');
  const refactoredLines = refactoredCode.split('\n');
  const maxLines = Math.max(originalLines.length, refactoredLines.length);

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
      <h3 className="text-white font-semibold">Side-by-Side Diff</h3>
      <div className="grid grid-cols-2 gap-2">
        {/* Original */}
        <div>
          <div className="bg-red-500/20 text-red-400 text-xs px-3 py-1 rounded-t-lg font-semibold">
            Original
          </div>
          <div className="bg-gray-950 rounded-b-lg p-3 overflow-x-auto">
            {originalLines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 text-xs w-6 shrink-0 select-none">
                  {i + 1}
                </span>
                <pre className="text-red-300 text-xs whitespace-pre-wrap break-all">
                  {line}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Refactored */}
        <div>
          <div className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-t-lg font-semibold">
            Refactored
          </div>
          <div className="bg-gray-950 rounded-b-lg p-3 overflow-x-auto">
            {refactoredLines.map((line, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-600 text-xs w-6 shrink-0 select-none">
                  {i + 1}
                </span>
                <pre className="text-green-300 text-xs whitespace-pre-wrap break-all">
                  {line}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}