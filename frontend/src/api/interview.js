import client from './client';

export const interviewAPI = {
  startSession: (data) => client.post('/interviews/setup', data),
  
  getSessions: async () => {
    const response = await client.get('/interviews/history');
    console.log('Raw interview response:', response.data); // Debug
    
    // Handle different response structures
    if (response.data?.data?.sessions && Array.isArray(response.data.data.sessions)) {
      return response.data.data.sessions;
    }
    if (response.data?.sessions && Array.isArray(response.data.sessions)) {
      return response.data.sessions;
    }
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Always return an array
    return [];
  },
  
  getSession: (id) => client.get(`/interviews/${id}`),
  
  submitAnswer: (sessionId, data) =>
    client.patch(`/interviews/${sessionId}/answer`, data),
  
  endSession: (sessionId) =>
    client.patch(`/interviews/${sessionId}/complete`),
  
  getReport: (sessionId) =>
    client.get(`/interviews/${sessionId}/report`),
};