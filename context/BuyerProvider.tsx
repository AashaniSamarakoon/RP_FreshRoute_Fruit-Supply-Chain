import React, { createContext, useContext, useState } from 'react';

interface BuyerContextType {
  // Define your context state and setters here
  // Example:
  // recentOrders: Order[];
  // setRecentOrders: (orders: Order[]) => void;
}

const BuyerContext = createContext<BuyerContextType | undefined>(undefined);

export const BuyerProvider = ({ children }: { children: React.ReactNode }) => {
  // const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const value = {
    // recentOrders,
    // setRecentOrders,
  };

  return (
    <BuyerContext.Provider value={value}>
      {children}
    </BuyerContext.Provider>
  );
};

export const useBuyer = () => {
  const context = useContext(BuyerContext);
  if (context === undefined) {
    throw new Error('useBuyer must be used within a BuyerProvider');
  }
  return context;
};
