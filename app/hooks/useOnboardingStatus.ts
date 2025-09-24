import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function useOnboardingStatus() {
  const { user, isLoaded } = useUser();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const fetchStatus = async () => {
      const res = await fetch('/api/user-status?clerkId=' + user.id);
      if (res.ok) {
        const data = await res.json();
        setOnboardingComplete(data.onboardingComplete);
      }
    };
    fetchStatus();
  }, [isLoaded, user]);

  return { onboardingComplete };
}
