import { z } from "zod";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { latestSnapshot, queueAsset } from "./cms/store";
import { getDb } from './queries/connection';

export const cmsRouter = createRouter({
  snapshot: adminQuery.query(async ({ctx}) => {
    const snapshot = await latestSnapshot(ctx.req,ctx.resHeaders);
    return {
      revision: snapshot.revision,
      branch: null,
      writesEnabled: !('verified' in snapshot) || snapshot.verified === true,
      contentSource: 'supabase' as const,
    };
  }),
  uploadImage: adminQuery
    .input(
      z
        .object({
          mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
          base64: z
            .string()
            .min(8)
            .max(2800000)
            .regex(/^[A-Za-z0-9+/]+={0,2}$/),
        })
        .strict()
    )
    .mutation(async ({ input, ctx }) => {
      const bytes = Buffer.from(input.base64, "base64");
      if (
        bytes.length > 2 * 1024 * 1024 ||
        bytes.toString("base64") !== input.base64
      )
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "حجم الصورة الأقصى 2 MB.",
        });
      const png = bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp =
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP";
      if (!(
        (input.mime === "image/png" && png) ||
        (input.mime === "image/jpeg" && jpg) ||
        (input.mime === "image/webp" && webp)
      ))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "نوع الصورة لا يطابق محتواها. استخدم PNG أو JPEG أو WebP.",
        });
      const ext =
        input.mime === "image/png"
          ? "png"
          : input.mime === "image/jpeg"
            ? "jpg"
            : "webp";
      const name = `${createHash("sha256").update(bytes).digest("hex")}.${ext}`;
      if (process.env.NODE_ENV === 'test') {
        const url = `/images/cms/${name}`;
        queueAsset({ path:'public'+url,content:input.base64 });
        return { url };
      }
      const db = getDb(ctx.req,ctx.resHeaders);
      const {error} = await db.storage.from('site-media').upload(name,bytes,{contentType:input.mime,upsert:true,cacheControl:'31536000'});
      if (error) throw new TRPCError({code:'SERVICE_UNAVAILABLE',message:'تعذر حفظ الصورة في Supabase. لم يتم تأكيد الرفع.'});
      return {url:db.storage.from('site-media').getPublicUrl(name).data.publicUrl};
    }),
});
