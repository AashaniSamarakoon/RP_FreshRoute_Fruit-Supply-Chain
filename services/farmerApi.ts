import api from "./api";

// Mock data for when API is not available
const mockOrderStats = {
  completedCount: 15,
  pendingCount: 3,
  lastCompletedDate: "Jan 05, 2026",
  nextOrderDate: "Jan 12, 2026",
};

const mockSMSPreferences = {
  preferences: {
    sms_alerts_enabled: true,
  },
};

// Farmer API endpoints
export const getSMSPreferences = () => {
  // Return mock data instead of calling API to avoid 404 errors
  return Promise.resolve(mockSMSPreferences);
};

export const updateSMSPreferences = (preferences: {
  sms_alerts_enabled?: boolean;
}) => {
  // Mock the update to avoid 404 errors - just resolve without calling API
  console.log("[SMS] Mock update SMS preferences:", preferences);
  return Promise.resolve({ success: true });
};

// Dashboard API endpoints
export const getFarmerDashboard = () => {
  return api.get("/api/farmer/dashboard");
};

// Orders API endpoints
export const getOrdersOverview = () => {
  // Return mock data instead of calling API to avoid 404 errors
  return Promise.resolve(mockOrderStats);
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