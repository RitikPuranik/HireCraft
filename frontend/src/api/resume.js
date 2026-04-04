import client from './client';

export const resumeAPI = {
  // Upload a PDF file
  upload: (formData) => client.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Get all resumes (returns array directly)
  getAll: async () => {
    const res = await client.get('/resumes');
    const data = res.data?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(res.data)) return res.data;
    return [];
  },

  analyze:    (id)       => client.post('/ats/analyze', { resumeId: id }),
  getOne:     (id)       => client.get(`/resumes/${id}`),
  create:     (data)     => client.post('/resumes', data),
  update:     (id, data) => client.put(`/resumes/${id}`, data),
  delete:     (id)       => client.delete(`/resumes/${id}`),
  download:   (id)       => client.get(`/resumes/${id}/download`, { responseType: 'blob' }),
  setDefault: (id)       => client.patch(`/resumes/${id}/default`),
};