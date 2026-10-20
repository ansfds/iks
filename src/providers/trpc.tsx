import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../server/router";
import type { ReactNode } from "react";
import { currentCmsRevision, confirmedCmsSave } from '@/lib/cms-state';

export const trpc = createTRPCReact<AppRouter>();

function onAuthError(error: unknown) {
  if ((error as { data?: { code?: string } })?.data?.code === "UNAUTHORIZED" && /^\/admin(?:\/|$)/.test(window.location.pathname)) {
    window.dispatchEvent(new Event("admin-session-expired"));
  }
}
const queryClient = new QueryClient({ queryCache: new QueryCache({ onError: onAuthError }), mutationCache: new MutationCache({ onError: onAuthError }) });
const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: () => ({ "x-admin-request": "1", "x-cms-editor": window.location.pathname.startsWith('/admin') ? '1' : '0', "x-cms-revision": currentCmsRevision() }),
      async fetch(input, init) {
        const response = await globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
        if (response.ok && response.headers.has('x-cms-commit')) confirmedCmsSave(response.headers.get('x-cms-commit')!, response.headers.get('x-cms-revision') || '');
        return response;
      },
    }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
