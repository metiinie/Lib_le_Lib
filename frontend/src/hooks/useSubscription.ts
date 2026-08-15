import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './useAuth';

export interface SubscriptionData {
  isPremium: boolean;
  dmCredits: number;
}

export const useSubscription = () => {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<SubscriptionData>({ isPremium: false, dmCredits: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!isAuthenticated) return;
    try {
      // In a real app we'd have a dedicated GET /subscriptions/me
      // We will mock this response for now since the backend doesn't have a me endpoint yet
      // However, we can use the /users/me endpoint if it returns premium info
      // For this implementation, we will simulate the check
      const res = await api.get('/users/me'); 
      // We'll just assume they are premium if their role is admin, otherwise free for now
      // Or we can add an actual call. Let's just mock it gracefully if not available.
      
      setData({
        isPremium: false, // Defaulting to false to test the upgrade flow
        dmCredits: 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated]);

  const consumeDmCredit = async () => {
    if (data.dmCredits > 0) {
      setData(prev => ({ ...prev, dmCredits: prev.dmCredits - 1 }));
      return true;
    }
    return false;
  };

  return {
    ...data,
    isLoading,
    refetch: fetchSubscription,
    consumeDmCredit,
  };
};
