import { useRef } from 'react';

export default function CodeEditor({ code, setCode, language }) {
  const fileInputRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCode(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold">Your Code</h2>
          {language && language !== 'unknown' && (
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-xs">
              {language}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700"
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setCode('')}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700"
          >
            🗑 Clear
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.php,.go,.rs,.html,.css"
        className="hidden"
      />

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste your code here or upload a file..."
        className="w-full h-80 bg-gray-950 text-green-300 font-mono text-sm p-4 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 resize-none"
        spellCheck={false}
      />

      <div className="text-gray-600 text-xs text-right">
        {code.split('\n').length} lines · {code.length} characters
      </div>
    </div>
  );
}