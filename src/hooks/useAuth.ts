import { trpc } from "@/providers/trpc";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { LOGIN_PATH } from "@/const";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = LOGIN_PATH } =
    options ?? {};

  const navigate = useNavigate();

  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      utils.auth.me.setData(undefined, null);
      navigate(redirectPath, { replace: true });
    },
    onError: () => toast.error("تعذر تسجيل الخروج. تحقق من الاتصال وأعد المحاولة."),
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);
  useEffect(() => {
    const expire = () => {
      void queryClient.cancelQueries();
      queryClient.clear();
      utils.auth.me.setData(undefined, null);
      navigate(`${LOGIN_PATH}?expired=1`, { replace: true });
    };
    window.addEventListener("admin-session-expired", expire);
    const timer = user?.expiresAt ? window.setTimeout(expire, Math.max(0, user.expiresAt - Date.now())) : undefined;
    return () => { window.removeEventListener("admin-session-expired", expire); window.clearTimeout(timer); };
  }, [user?.expiresAt, navigate, utils, queryClient]);

  useEffect(() => {
    if (redirectOnUnauthenticated && !isLoading && !user) {
      const currentPath = window.location.pathname;
      if (currentPath !== redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [redirectOnUnauthenticated, isLoading, user, navigate, redirectPath]);

  return useMemo(
    () => ({
      user: error ? null : user ?? null,
      isAuthenticated: !error && !!user,
      isLoading: isLoading || logoutMutation.isPending,
      error,
      logout,
      refresh: refetch,
    }),
    [user, isLoading, logoutMutation.isPending, error, logout, refetch],
  );
}
