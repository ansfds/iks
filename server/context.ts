import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { AdminIdentity } from './auth/stateless';
import { authenticateRequest } from "./auth/service";
import type { TRPCError } from "@trpc/server";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: AdminIdentity;
  sessionExpiresAt?: number;
  authError?: TRPCError;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  try {
    const session = await authenticateRequest(opts.req);
    ctx.user = session?.user;
    ctx.sessionExpiresAt = session?.expiresAt;
  } catch (error) {
    ctx.authError = error as TRPCError;
  }
  return ctx;
}
