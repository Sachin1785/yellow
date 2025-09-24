import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export function useInsertUserOnAuth() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [inserted, setInserted] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || inserted) return;
    const insertUser = async () => {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, email: user.emailAddresses?.[0]?.emailAddress || '' })
      });
      setInserted(true);
    };
    insertUser();
  }, [isLoaded, isSignedIn, user, inserted]);
}
