import { Hono } from "hono";
import { handle } from "hono/vercel";
import { seoResponse } from "../server/seo";

// The original public path is passed explicitly by the Vercel rewrite.
const app = new Hono();
app.get("*", (context) => seoResponse(context.req.query("path") || "/"));
export default handle(app);
