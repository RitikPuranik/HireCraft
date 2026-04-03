import client from './client';

export const paymentAPI = {
  getPlans: () => client.get('/subscription/plans'),
  
  createOrder: () => client.post('/subscription/create-order'), // Remove planId parameter
  
  verifyPayment: (data) => client.post('/subscription/verify', data),
  
  getSubscription: () => client.get('/subscription/me'), // Change from /subscription to /me
};