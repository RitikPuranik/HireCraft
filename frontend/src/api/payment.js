import client from './client';

export const paymentAPI = {
  getPlans:        ()           => client.get('/subscription/plans'),
  getSubscription: ()           => client.get('/subscription/me'),
  getUsage:        ()           => client.get('/subscription/usage'),
  createOrder:     (data = {})  => client.post('/subscription/create-order', data),
  verifyPayment:   (data)       => client.post('/subscription/verify', data),
  cancel:          ()           => client.post('/subscription/cancel'),
};

export const couponAPI = {
  validate: (code) => client.post('/coupons/validate', { code }),
};
