import client from './client';

export const interviewAPI = {
  startSession: (data) => client.post('/interviews/setup', data),
  getSessions: () => client.get('/interviews/history'),
  getSession: (id) => client.get(`/interviews/${id}`),
  submitAnswer: (sessionId, data) =>
    client.patch(`/interviews/${sessionId}/answer`, data),
  endSession: (sessionId) =>
    client.patch(`/interviews/${sessionId}/complete`),
  getReport: (sessionId) =>
    client.get(`/interviews/${sessionId}/report`),
};