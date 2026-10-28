import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { login, logout } from "./auth/service";
import { supabaseConfigured } from './supabase/config';

export const authRouter = createRouter({
  configuration: publicQuery.query(() => ({ provider: 'supabase' as const, configured: supabaseConfigured() })),
  me: publicQuery.query(({ ctx }) => {
    if (ctx.authError) throw ctx.authError;
    return ctx.user ? { id: ctx.user.id, supabaseUserId: ctx.user.supabaseUserId, name: ctx.user.name, role: "admin" as const, expiresAt: ctx.sessionExpiresAt! } : null;
  }),
  login: publicQuery.input(z.object({
    email: z.email('أدخل البريد الإلكتروني الصحيح.').trim().max(320),
    password: z.string().min(1, "أدخل كلمة المرور.").max(1024),
  })).mutation(({ ctx, input }) => login(ctx.req, ctx.resHeaders, input.email, input.password)),
  logout: publicQuery.mutation(({ ctx }) => logout(ctx.req, ctx.resHeaders)),
});
