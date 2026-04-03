import client from './client';

export const resumeAPI = {
  getAll: async () => {
    const response = await client.get('/resumes');
    console.log('Raw resume response:', response.data); // Debug
    
    // Handle different response structures
    if (response.data?.data?.resumes && Array.isArray(response.data.data.resumes)) {
      return response.data.data.resumes;
    }
    if (response.data?.resumes && Array.isArray(response.data.resumes)) {
      return response.data.resumes;
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
  
  getOne: (id) => client.get(`/resumes/${id}`),
  analyze: (id) => client.post(`/resumes/${id}/analyze`),
  delete: (id) => client.delete(`/resumes/${id}`),
  getAnalysis: (id) => client.get(`/resumes/${id}/analysis`),
  update: (id, data) => client.put(`/resumes/${id}`, data),
  download: (id) => client.get(`/resumes/${id}/download`, { responseType: 'blob' }),
  setDefault: (id) => client.patch(`/resumes/${id}/default`),
};