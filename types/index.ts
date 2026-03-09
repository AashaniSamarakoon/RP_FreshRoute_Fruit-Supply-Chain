// types/index.ts

export interface Order {
  id: string;
  date: string;
  status: "Pending" | "Completed" | "Cancelled";
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
  status: "In Transit" | "Delivered" | "Delayed";
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
  location: string;
  grade: string;
  quality: string;
  quantity_proposed: string;
}

export interface NavItemProps {
  icon: React.ElementType<any>; // Using any for now, but could be more specific
  label: string;
  active?: boolean;
}

// Order Tracking Types
export type OrderStatus =
  | "OPEN"
  | "MATCHED"
  | "PENDING_BUYER"
  | "PENDING_FARMER"
  | "AWAITING_PAYMENT"
  | "AUTHORIZED_PAYMENT"  // deposit/authorization placed
  | "AUTHORIZED_PAYMENT"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "AUTHORIZED" | "RELEASED";

export type SlipVerificationStatus =
  | "PENDING"
  | "AUTO_APPROVED"
  | "FLAGGED"
  | "APPROVED"
  | "REJECTED";

export interface PlacedOrder {
  id: string;
  buyer_id: string;
  fruit_type: string;
  variant: string;
  quantity: number;
  grade: "A" | "B" | "C";
  required_date: string;
  delivery_location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  target_price: number | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number | null;
  selected_farmer_id: string | null;
  harvest_id: string | null;
  blockchain_status: string | null;
  transporter_id: string | null;
  farmer_accepted_at: string | null;
  quality_confirmed_at: string | null;
  delivered_at: string | null;
  delivery_notes: string | null;
  completed_at?: string | null;
  picked_up_at?: string | null;
  // additional pricing breakdown fields returned by backend
  unitPrice?: number;
  basePrice?: number;
  serviceCharge?: number;
  deliveryFee?: number;
  totalPrice?: number;
  deliveryType?: string;
  // pricing object used by farmer endpoint
  pricing?: {
    unitPrice?: number;
    grossEarning?: number;
    platformFee?: number;
    platformFeeRate?: number;
    farmerEarning?: number;
  };
  // server may also include productImages
  productImages?: string[];
  product_images?: string[];
  // PayHere reference populated by the backend notify webhook after payment
  payhere_payment_id?: string | null;
}

export interface Payment {
  id: string;
  order_id: string;
  buyer_id: string;
  amount: number;
  currency: "LKR";
  status: PaymentStatus;
  payment_method: "bank_slip";
  payment_slip_url?: string;
  slip_uploaded_at?: string;
  slip_ocr_data?: {
    amount: number;
    date: string;
    reference: string;
    bank: string;
    confidence: number;
  };
  slip_verification_status: SlipVerificationStatus;
  slip_verified_by?: string;
  slip_verified_at?: string;
  slip_verification_notes?: string;
  authorized_at?: string;
  released_at?: string;
}

export interface FarmerInfo {
  id: string;
  name: string;
  phone: string;
  rating?: number;
  location?: string;
}

export interface TransporterInfo {
  id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_number: string;
  vehicle_type?: string;
  current_latitude?: number;
  current_longitude?: number;
}

export interface PaymentSlipUploadResponse {
  message: string;
  verificationStatus: SlipVerificationStatus;
  ocrData: {
    amount: number;
    date: string;
    reference: string;
    bank: string;
    confidence: number;
  };
  fraudScore?: {
    score: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    flags: string[];
  };
}

// Complaint Types
export interface Complaint {
  id: string;
  order_id: string;
  user_name: string;
  user_complaint: string;
  status: string;
  created_at: string;
  farmer_id: string;
}
