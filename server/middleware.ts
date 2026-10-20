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
  if (type !== 'query' || /^(auth\.|cms\.|ping$)/.test(path)) return next();
  const editor = Boolean(ctx.user && (ctx.req.headers.get('x-cms-editor') === '1' || path.includes('.admin.') || path.startsWith('admin.')));
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
  if (type !== 'mutation') return next();
  return withContent(true, true, ctx.req, path, ctx.resHeaders, () => next());
});
