import client from './client';

export const interviewAPI = {
  startSession: (data) => client.post('/interviews/start', data),
  getSessions: () => client.get('/interviews/sessions'),
  getSession: (id) => client.get(`/interviews/sessions/${id}`),
  submitAnswer: (sessionId, data) =>
    client.post(`/interviews/sessions/${sessionId}/answer`, data),
  endSession: (sessionId) =>
    client.post(`/interviews/sessions/${sessionId}/end`),
  getReport: (sessionId) =>
    client.get(`/interviews/sessions/${sessionId}/report`),
};
