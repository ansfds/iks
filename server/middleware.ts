import { ErrorMessages } from "../contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { assertSameOrigin } from "./auth/security";
import { withContent } from './cms/store';

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return { ...shape, message: error.code === "INTERNAL_SERVER_ERROR" ? "تعذر تنفيذ الطلب. حاول مرة أخرى." : shape.message,
      data: { ...shape.data, stack: undefined } };
  },
});

export const createRouter = t.router;
const browserRequest = t.middleware(({ ctx, type, next }) => {
  if (type === "mutation") assertSameOrigin(ctx.req);
  return next();
});
export const publicQuery = t.procedure.use(browserRequest).use(async ({ ctx, type, path, next }) => {
  if (type !== 'query' || /^(auth\.|cms\.|contact\.|ping$)/.test(path)) return next();
  // Private procedures authenticate before reading private data. An untrusted
  // x-cms-editor header never upgrades a public procedure to an admin read.
  if (path.includes('.admin.') || path.startsWith('admin.')) return next();
  const editor = false;
  return withContent(editor, false, ctx.req, path, ctx.resHeaders, () => next());
});

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.authError) throw ctx.authError;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = publicQuery.use(requireAuth);
export const adminQuery = authedQuery.use(requireRole("admin")).use(async ({ ctx, type, path, next }) => {
  if (/^(auth\.|cms\.snapshot$|cms\.deployment$|contact\.)/.test(path)) return next();
  return withContent(true, type === 'mutation', ctx.req, path, ctx.resHeaders, () => next());
});
