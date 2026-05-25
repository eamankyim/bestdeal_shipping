import api from '../config/api';
import { API_ENDPOINTS } from '../config/constants';

export const trackingService = {
  trackShipment: async (trackingId) => {
    const response = await api.get(API_ENDPOINTS.TRACKING.TRACK(trackingId));
    return response.data;
  },
};






