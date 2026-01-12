// This is a placeholder for a custom hook to fetch deliveries.
import { useEffect, useState } from 'react';
import { getDeliveries } from '../../services/buyerApi';

export const useDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setIsLoading(true);
        const data = await getDeliveries();
        setDeliveries(data);
      } catch (e) {
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  return { deliveries, isLoading, error };
};
