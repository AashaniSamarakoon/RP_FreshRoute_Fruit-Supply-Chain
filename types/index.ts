// types/index.ts

export interface Order {
  id: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  total: number;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  status: 'In Transit' | 'Delivered' | 'Delayed';
  estimatedDelivery: string;
  driverName: string;
}

export interface BuyerDashboardData {
  upcomingDeliveries: Delivery[];
  recentOrders: Order[];
}

export interface DealData {
  id: string;
  title: string;
  price: string;
  unit: string;
  description: string;
}

export interface NavItemProps {
  icon: React.ElementType<any>; // Using any for now, but could be more specific
  label: string;
  active?: boolean;
}
