import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { login, logout } from "./auth/service";

export const authRouter = createRouter({
  challenge: publicQuery.query(() => ({ required: process.env.VERCEL === '1', siteKey: process.env.TURNSTILE_SITE_KEY || null })),
  me: publicQuery.query(({ ctx }) => {
    if (ctx.authError) throw ctx.authError;
    return ctx.user ? { id: ctx.user.id, name: ctx.user.name, role: "admin" as const, expiresAt: ctx.sessionExpiresAt! } : null;
  }),
  login: publicQuery.input(z.object({
    username: z.string().trim().min(1, "أدخل اسم المستخدم.").max(100),
    password: z.string().min(1, "أدخل كلمة المرور.").max(1024),
    challengeToken: z.string().max(2048).optional(),
  })).mutation(({ ctx, input }) => login(ctx.req, ctx.resHeaders, input.username, input.password, input.challengeToken)),
  logout: publicQuery.mutation(({ ctx }) => logout(ctx.req, ctx.resHeaders)),
});
