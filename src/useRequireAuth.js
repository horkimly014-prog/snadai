import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { useAuthGate } from "./useAuthGate";

export function useRequireAuth() {
  const { user } = useAuth();
  const { requestAuth } = useAuthGate();

  return useCallback(
    (action) => {
      if (user) {
        action?.();
        return true;
      }
      requestAuth();
      return false;
    },
    [user, requestAuth]
  );
}
