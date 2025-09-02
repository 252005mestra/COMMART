import axios from 'axios';

const API_URL = 'http://localhost:5000/api/orders';

export const createOrder = (orderData) =>
  axios.post(API_URL, orderData, { withCredentials: true });

export const getArtistOrders = () =>
  axios.get(`${API_URL}/artist`, { withCredentials: true });

export const getClientOrders = () =>
  axios.get(`${API_URL}/client`, { withCredentials: true });

export const getOrderById = (id) =>
  axios.get(`${API_URL}/${id}`, { withCredentials: true });

export const updateOrderStatus = (id, status, reason) =>
  axios.put(`${API_URL}/${id}/status`, { status, reason }, { withCredentials: true });