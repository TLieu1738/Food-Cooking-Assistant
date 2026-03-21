import { useUser } from '@civic/auth/react';

export default function useCivicUser() {
  try {
    return useUser();
  } catch {
    return { user: null, signIn: () => {}, signOut: () => {}, isLoading: false };
  }
}
