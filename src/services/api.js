// Minimal API handler skeleton
const API = {
  getStatus: async () => {
    // Placeholder: replace with actual fetch to backend
    return { ok: true, version: '0.0.1' };
  }
};

if(typeof window !== 'undefined') window.API = API;
