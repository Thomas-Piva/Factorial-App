import type { User } from "@/types/database";
import { useCurrentUser } from "@/lib/queries/users";

interface CurrentUserResult {
  user: User | null;
  isLoading: boolean;
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;
}

export function useCurrentUserHook(): CurrentUserResult {
  const { data: user = null, isLoading } = useCurrentUser();

  return {
    user,
    isLoading,
    isEmployee: user?.role === "employee",
    isManager: user?.role === "manager",
    isAdmin: user?.role === "admin",
  };
}
