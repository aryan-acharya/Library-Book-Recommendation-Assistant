const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  meta: () => request('/api/meta'),
  books: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/books?${q}`);
  },
  book: (id) => request(`/api/books/${id}`),
  similar: (id) => request(`/api/similar/${id}`),
  search: (q, page = 1, limit = 20) =>
    request(`/api/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),
  rules: () => request('/api/rules'),
  peas: () => request('/api/peas'),
  knowledgeBase: (id) =>
    request(id ? `/api/knowledge-base?id=${encodeURIComponent(id)}` : '/api/knowledge-base'),
  recommend: (payload) =>
    request('/api/recommend', { method: 'POST', body: JSON.stringify(payload) }),
  backwardChain: (payload) =>
    request('/api/backward-chain', { method: 'POST', body: JSON.stringify(payload) }),
  hillClimb: (payload) =>
    request('/api/hill-climb', { method: 'POST', body: JSON.stringify(payload) }),
};
