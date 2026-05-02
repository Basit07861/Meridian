import { useState, useEffect } from 'react';
import { getRepos, getRepoContents, getFileContent } from '../services/api';

export default function RepoPicker({ onFileSelect }) {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [contents, setContents] = useState([]);
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const { data } = await getRepos();
      setRepos(data);
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const fetchContents = async (repo, filePath = '') => {
    setLoading(true);
    try {
      const { data } = await getRepoContents(repo.owner.login, repo.name, filePath);
      setContents(Array.isArray(data) ? data : [data]);
      setPath(filePath);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (item) => {
    if (item.type === 'dir') {
      fetchContents(selectedRepo, item.path);
    } else {
      setLoading(true);
      try {
        const { data } = await getFileContent(
          selectedRepo.owner.login,
          selectedRepo.name,
          item.path
        );
        onFileSelect(data.content, item.name);
      } catch (err) {
        setError('Failed to load file content');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-4">
      <h3 className="text-white font-semibold">📁 Pick from GitHub</h3>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded p-2">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-gray-400 text-sm">Loading...</div>
      )}

      {/* Repo List */}
      {!selectedRepo && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => {
                setSelectedRepo(repo);
                fetchContents(repo);
              }}
              className="w-full text-left bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-lg border border-gray-700 transition"
            >
              <div className="text-white text-sm font-medium">{repo.name}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                {repo.language} · ⭐ {repo.stargazers_count}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* File Browser */}
      {selectedRepo && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRepo(null);
                setContents([]);
                setPath('');
              }}
              className="text-blue-400 text-xs hover:underline"
            >
              ← Back to repos
            </button>
            {path && (
              <>
                <span className="text-gray-600 text-xs">/</span>
                <button
                  onClick={() => fetchContents(selectedRepo, '')}
                  className="text-blue-400 text-xs hover:underline"
                >
                  root
                </button>
                <span className="text-gray-500 text-xs">/ {path}</span>
              </>
            )}
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {contents.map((item) => (
              <button
                key={item.sha}
                onClick={() => handleFileClick(item)}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition flex items-center gap-2"
              >
                <span>{item.type === 'dir' ? '📁' : '📄'}</span>
                <span className="text-white">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}