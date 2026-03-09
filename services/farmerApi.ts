import api from "./api";

// Farmer API endpoints
export const getSMSPreferences = () => {
  return api.get("/api/sms/preferences");
};

export const updateSMSPreferences = (preferences: {
  phone?: string;
  sms_alerts_enabled?: boolean;
  sms_frequency?: string;
}) => {
  return api.put("/api/sms/preferences", preferences);
};

// Dashboard API endpoints
export const getFarmerDashboard = () => {
  return api.get("/api/farmer/dashboard");
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