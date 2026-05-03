import api from "./api";

export const getOrders = () => {
  return api.get("/api/buyer/place-order");
};

export const submitOrder = (orderData: any) => {
  return api.post("/api/buyer/place-order", orderData);
};

export const getDeliveries = () => {
  return api.get("/api/buyer/deliveries");
};
