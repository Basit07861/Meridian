import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

// Automatically attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// AUTH
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// REVIEWS
export const analyzeCode = (data) => API.post('/review/analyze', data);
export const getReviews = () => API.get('/review/history');
export const getReview = (id) => API.get(`/review/${id}`);
export const deleteReview = (id) => API.delete(`/review/${id}`);
export const shareReview = (id) => API.post(`/review/share/${id}`);

// GITHUB
export const getRepos = () => API.get('/github/repos');
export const getRepoContents = (owner, repo, path = '') =>
  API.get(`/github/repos/${owner}/${repo}/contents?path=${path}`);
export const getFileContent = (owner, repo, path) =>
  API.get(`/github/repos/${owner}/${repo}/file?path=${path}`);