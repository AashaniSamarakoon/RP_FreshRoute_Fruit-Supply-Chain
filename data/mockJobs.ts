// app/mock/mockJobs.ts (adjust path as you like)

export type OrderStatus = "pending" | "picked_up" | "delivered";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Address {
  line1: string;
  city: string;
  district: string;
}

export interface Farmer {
  id: string;
  name: string;
  address: Address;
  location: Coordinate;
}

export interface Buyer {
  id: string;
  name: string;
  address: Address;
  location: Coordinate;
}

export interface Order {
  id: string; // order_id
  pickupOrder: number; // 1,2,3...
  fruitType: string;
  quantityKg: number;
  status: OrderStatus;
  farmer: Farmer;
  buyer: Buyer;
}

export interface Job {
  id: string; // job_id
  date: string; // ISO date
  buyer: Buyer;
  vehiclePlate: string;
  driverName: string;
  orders: Order[];
  status: "pending" | "in_progress" | "completed";
}

const buyer1: Buyer = {
  id: "B001",
  name: "FreshMart Supermarket - Kandy",
  address: {
    line1: "21 River View Road",
    city: "Kandy",
    district: "Central Province",
  },
  location: {
    latitude: 7.2905715,
    longitude: 80.6337262,
  },
};

const farmer1: Farmer = {
  id: "F001",
  name: "Farmer Sunil",
  address: {
    line1: "Green Valley Farm",
    city: "Matale",
    district: "Central Province",
  },
  location: {
    latitude: 7.4713,
    longitude: 80.6234,
  },
};

const farmer2: Farmer = {
  id: "F002",
  name: "Farmer Nirosha",
  address: {
    line1: "Golden Orchard",
    city: "Kurunegala",
    district: "North Western Province",
  },
  location: {
    latitude: 7.4863,
    longitude: 80.3647,
  },
};

const farmer3: Farmer = {
  id: "F003",
  name: "Farmer Ruwan",
  address: {
    line1: "Hilltop Farm",
    city: "Gampola",
    district: "Central Province",
  },
  location: {
    latitude: 7.168,
    longitude: 80.5696,
  },
};

export const MOCK_JOBS: Job[] = [
  {
    id: "JOB-2025-0001",
    date: "2025-12-09",
    buyer: buyer1,
    driverName: "Kamal Perera",
    vehiclePlate: "WP KB-1234",
    status: "pending",
    orders: [
      {
        id: "ORD-1001",
        pickupOrder: 1,
        fruitType: "Mango",
        quantityKg: 250,
        status: "pending",
        farmer: farmer1,
        buyer: buyer1,
      },
      {
        id: "ORD-1002",
        pickupOrder: 2,
        fruitType: "Banana",
        quantityKg: 300,
        status: "pending",
        farmer: farmer2,
        buyer: buyer1,
      },
      {
        id: "ORD-1003",
        pickupOrder: 3,
        fruitType: "Papaya",
        quantityKg: 180,
        status: "pending",
        farmer: farmer3,
        buyer: buyer1,
      },
    ],
  },
  {
    id: "JOB-2025-0002",
    date: "2025-12-09",
    buyer: {
      ...buyer1,
      id: "B002",
      name: "Fruit Hub - Colombo",
      address: {
        line1: "55 Galle Road",
        city: "Colombo",
        district: "Western Province",
      },
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
      },
    },
    driverName: "Chatura Silva",
    vehiclePlate: "CP KG-5678",
    status: "in_progress",
    orders: [
      {
        id: "ORD-2001",
        pickupOrder: 1,
        fruitType: "Pineapple",
        quantityKg: 400,
        status: "picked_up",
        farmer: farmer1,
        buyer: buyer1, // for simplicity
      },
      {
        id: "ORD-2002",
        pickupOrder: 2,
        fruitType: "Guava",
        quantityKg: 150,
        status: "pending",
        farmer: farmer3,
        buyer: buyer1,
      },
    ],
  },
];
