// 报名数据存在 Supabase。这里的 key 是公开用的“可发布 key”，权限由数据库规则控制：
// 任何人只能提交报名，看不到别人的报名；只有管理员名单里的账号能看和改。
GP.db = (function(){
  const URL_ = "https://ozdfujekpbvxzfcseegg.supabase.co";
  const KEY = "sb_publishable_iDY_oNf6vju0vNQeoz4pGg_HUcKv_Ku";
  const store = {
    get(){ try{ return JSON.parse(sessionStorage.getItem("gp_session")||"null"); }catch(e){ return null; } },
    set(v){ try{ v ? sessionStorage.setItem("gp_session", JSON.stringify(v)) : sessionStorage.removeItem("gp_session"); }catch(e){} },
  };
  let session = store.get();
  async function req(path, {method="GET", body, auth=false, prefer}={}){
    const h = {"apikey": KEY, "Content-Type": "application/json"};
    if(auth && session) h["Authorization"] = "Bearer " + session.access_token;
    if(prefer) h["Prefer"] = prefer;
    const r = await fetch(URL_ + path, {method, headers: h, body: body ? JSON.stringify(body) : undefined});
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    if(!r.ok) throw Object.assign(new Error((data && (data.msg || data.message || data.error_description)) || ("HTTP " + r.status)), {status: r.status});
    return data;
  }
  return {
    submitSignup: row => req("/rest/v1/signups", {method: "POST", body: row, prefer: "return=minimal"}),
    signIn: async (email, password) => { session = await req("/auth/v1/token?grant_type=password", {method: "POST", body: {email, password}}); store.set(session); return session; },
    signUp: (email, password) => req("/auth/v1/signup", {method: "POST", body: {email, password}}),
    signOut: () => { session = null; store.set(null); },
    session: () => session,
    listSignups: () => req("/rest/v1/signups?select=*&order=created_at.desc", {auth: true}),
    // 投稿
    linkInfo: async t => (await req("/rest/v1/rpc/link_info", {method: "POST", body: {t}}))[0] || null,
    // 一次提交多条时，每条的字段必须一样，缺的补 null
    submitWork: rows => {
      const keys = ["token","stop_no","season","kind","platform","url","title","note"];
      const body = rows.map(r => Object.fromEntries(keys.map(k => [k, r[k] ?? null])));
      return req("/rest/v1/submissions", {method: "POST", body, prefer: "return=minimal"});
    },
    approved: (season, stopNo) => req(`/rest/v1/submissions?select=stop_no,kind,platform,url,title,note,created_at&status=eq.${encodeURIComponent("已通过")}&season=eq.${encodeURIComponent(season)}` + (stopNo ? `&stop_no=eq.${stopNo}` : "") + "&order=created_at.desc"),
    listSubmissions: () => req("/rest/v1/submissions?select=*&order=created_at.desc", {auth: true}),
    setSubmissionStatus: (id, status) => req(`/rest/v1/submissions?id=eq.${encodeURIComponent(id)}`, {method: "PATCH", body: {status}, auth: true, prefer: "return=minimal"}),
    listLinks: () => req("/rest/v1/holder_links?select=*&order=stop_no.desc", {auth: true}),
    createLink: async (stop_no, season, label) => (await req("/rest/v1/holder_links", {method: "POST", body: {stop_no, season, label}, auth: true, prefer: "return=representation"}))[0],
    setLinkActive: (token, active) => req(`/rest/v1/holder_links?token=eq.${encodeURIComponent(token)}`, {method: "PATCH", body: {active}, auth: true, prefer: "return=minimal"}),
    setStatus: (id, status) => req(`/rest/v1/signups?id=eq.${encodeURIComponent(id)}`, {method: "PATCH", body: {status}, auth: true, prefer: "return=minimal"}),
  };
})();
