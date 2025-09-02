import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notifications';

export const getNotifications = () =>
  axios.get(API_URL, { withCredentials: true });

export const markNotificationAsRead = (id) =>
  axios.put(`${API_URL}/${id}/read`, {}, { withCredentials: true });