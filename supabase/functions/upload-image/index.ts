// 流浪者发帖时上传照片。要同时满足：带着登录账号的凭证（Authorization），
// 专属链接有效，并且这个链接绑定的就是这个账号。图片存到公开的 post-images 桶。
// 每一站每小时最多 30 张。部署：Supabase 函数 upload-image（verify_jwt 关，函数里自己验证）。
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const MAX = 5 * 1024 * 1024;
const PER_HOUR = 30;
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
}
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "只支持 POST" });
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json(401, { error: "请先登录" });

  let form: FormData;
  try { form = await req.formData(); } catch { return json(400, { error: "格式不对" }); }
  const token = String(form.get("token") || "");
  const file = form.get("file");
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json(400, { error: "链接不对" });
  if (!(file instanceof File)) return json(400, { error: "没有图片" });
  if (file.size > MAX) return json(413, { error: "图片太大，最多 5MB" });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: who, error: eu } = await admin.auth.getUser(jwt);
  if (eu || !who?.user) return json(401, { error: "登录过期了，刷新页面重新登录" });

  const { data: link, error: e1 } = await admin.from("holder_links")
    .select("stop_no").eq("token", token).eq("active", true).eq("user_id", who.user.id).maybeSingle();
  if (e1) return json(500, { error: "验证失败" });
  if (!link) return json(403, { error: "这个链接现在不能发帖" });

  // 限频：这一站过去一小时传了多少张
  const { data: n, error: ec } = await admin.rpc("recent_uploads", { stop: link.stop_no });
  if (ec) return json(500, { error: "验证失败" });
  if ((n ?? 0) >= PER_HOUR) return json(429, { error: "照片传得太快了，过一会儿再试" });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) return json(415, { error: "只支持 JPG、PNG、WebP 图片" });
  const path = `${link.stop_no}/${crypto.randomUUID()}.${ext}`;
  const { error: e2 } = await admin.storage.from("post-images").upload(path, bytes, { contentType: MIME[ext], upsert: false });
  if (e2) return json(500, { error: "上传失败" });
  const { data } = admin.storage.from("post-images").getPublicUrl(path);
  return json(200, { url: data.publicUrl });
});
