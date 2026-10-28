import { z } from "zod";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { latestSnapshot, queueAsset } from "./cms/store";
import { deploymentStatus } from "./cms/deployment";

export const cmsRouter = createRouter({
  snapshot: adminQuery.query(async () => {
    const snapshot = await latestSnapshot();
    return {
      revision: snapshot.revision,
      branch: process.env.CMS_BRANCH || null,
      writesEnabled: false,
      contentSource: 'local-catalog' as const,
    };
  }),
  deployment: adminQuery
    .input(z.object({ commit: z.string().regex(/^[0-9a-f]{40}$/) }))
    .query(({ input }) => deploymentStatus(input.commit)),
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
    .mutation(({ input }) => {
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
      const url = `/images/cms/${createHash("sha256").update(bytes).digest("hex")}.${ext}`;
      queueAsset({ path: "public" + url, content: input.base64 });
      return { url };
    }),
});
