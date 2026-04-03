import client from './client';

export const resumeAPI = {
  upload: (formData) =>
    client.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: () => client.get('/resumes'),
  getOne: (id) => client.get(`/resumes/${id}`),
  analyze: (id) => client.post(`/resumes/${id}/analyze`),
  delete: (id) => client.delete(`/resumes/${id}`),
  getAnalysis: (id) => client.get(`/resumes/${id}/analysis`),
};
