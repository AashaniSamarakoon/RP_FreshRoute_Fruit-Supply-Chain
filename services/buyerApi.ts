import api from './api';

// Replace with your actual API endpoint
const API_URL = 'https://api.example.com/buyer';

export const getOrders = () => {
  return api.get(`${API_URL}/orders`);
};

export const submitOrder = (orderData: any) => {
  return api.post(`${API_URL}/orders`, orderData);
};

export const getDeliveries = () => {
    return api.get(`${API_URL}/deliveries`);
};
