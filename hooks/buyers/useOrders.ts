// This is a placeholder for a custom hook to fetch orders.
// In a real app, you would use a library like React Query here.
import { useEffect, useState } from 'react';
import { getOrders } from '../../services/buyerApi';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await getOrders();
        setOrders(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, isLoading, error };
};
