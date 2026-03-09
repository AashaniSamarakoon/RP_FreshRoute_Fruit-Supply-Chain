import api from "./api";

// Farmer API endpoints
export const getSMSPreferences = () => {
  return api.get("/api/sms-preferences");
};

export const updateSMSPreferences = (preferences: {
  sms_alerts_enabled?: boolean;
}) => {
  return api.put("/api/sms-preferences", preferences);
};

// Dashboard API endpoints
export const getFarmerDashboard = () => {
  return api.get("/api/farmer/dashboard");
};

// Orders API endpoints
export const getOrdersOverview = () => {
  return api.get("/api/orders/overview");
};

// Fruits API endpoints
export const getAvailableFruits = () => {
  return api.get("/api/fruits");
};

// Complaints API endpoints
export const getFarmerComplaints = () => {
  return api.get("/api/complaints");
};

export const getComplaintDetails = (id: string) => {
  return api.get(`/api/complaints/${id}`);
};