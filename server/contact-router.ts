import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, adminQuery, publicQuery } from "./middleware";
import { getDb } from './queries/connection';
function check(error:unknown) { if(error) throw new TRPCError({code:'SERVICE_UNAVAILABLE',message:'تعذر تحميل أو حفظ الرسائل الخاصة.'}); }
const contact = (r:Record<string,unknown>)=>({id:Number(r.id),studentName:String(r.student_name),parentName:String(r.parent_name),email:String(r.email),phone:r.phone as string|null,grade:r.grade as string|null,message:String(r.message),language:String(r.language),isRead:Boolean(r.is_read),createdAt:new Date(String(r.created_at))});
const privateStorageRequired = () => {
  throw new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message:
      "استقبال الرسائل عبر الموقع غير مفعّل. تواصل عبر الهاتف أو واتساب الظاهرين في الموقع.",
  });
};
export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        studentName: z.string().max(200),
        parentName: z.string().max(200),
        email: z.string().email(),
        phone: z.string().max(50).optional(),
        grade: z.string().max(80).optional(),
        message: z.string().max(4000),
        language: z.enum(["en", "ar"]).default("en"),
      })
    )
    .mutation(privateStorageRequired),
  list: adminQuery
    .input(
      z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
        search: z.string().optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({input,ctx})=>{
      const page=Math.max(1,Math.floor(input.page||1)),limit=Math.max(1,Math.min(100,Math.floor(input.limit||25)));
      let query=getDb(ctx.req,ctx.resHeaders).from('contacts').select('*',{count:'exact'}).order('created_at',{ascending:false});
      if(input.isRead!==undefined) query=query.eq('is_read',input.isRead);
      if(input.search) query=query.ilike('student_name','%'+input.search.replace(/[%_]/g,'')+'%');
      const {data,error,count}=await query.range((page-1)*limit,page*limit-1);check(error);
      return {items:(data||[]).map(contact),total:count||0,page,totalPages:Math.ceil((count||0)/limit)};
    }),
  getById: adminQuery
    .input(z.object({ id: z.number() }))
    .query(async ({input,ctx})=>{const {data,error}=await getDb(ctx.req,ctx.resHeaders).from('contacts').select('*').eq('id',input.id).maybeSingle();check(error);return data?contact(data):null;}),
  markRead: adminQuery
    .input(z.object({ id: z.number(), isRead: z.boolean() }))
    .mutation(async ({input,ctx})=>{const {error}=await getDb(ctx.req,ctx.resHeaders).from('contacts').update({is_read:input.isRead}).eq('id',input.id);check(error);return {success:true};}),
  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({input,ctx})=>{const {error}=await getDb(ctx.req,ctx.resHeaders).from('contacts').delete().eq('id',input.id);check(error);return {success:true};}),
  stats: adminQuery.query(async ({ctx})=>{
    const db=getDb(ctx.req,ctx.resHeaders);
    const [all,unread]=await Promise.all([db.from('contacts').select('id',{head:true,count:'exact'}),db.from('contacts').select('id',{head:true,count:'exact'}).eq('is_read',false)]);
    check(all.error||unread.error);return {total:all.count||0,unread:unread.count||0};
  }),
});
