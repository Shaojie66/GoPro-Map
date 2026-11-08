// 报名数据存在 Supabase。这里的 key 是公开用的“可发布 key”，权限由数据库规则控制：
// 任何人只能提交报名，看不到别人的报名；只有管理员名单里的账号能看和改。
GP.db = (function(){
  const URL_ = "https://ozdfujekpbvxzfcseegg.supabase.co";
  const KEY = "sb_publishable_iDY_oNf6vju0vNQeoz4pGg_HUcKv_Ku";
  // 登录状态存在本机浏览器里（localStorage），关掉网页再来也还是登录的
  const store = {
    get(){ try{ return JSON.parse(localStorage.getItem("gp_session")||"null"); }catch(e){ return null; } },
    set(v){ try{ v ? localStorage.setItem("gp_session", JSON.stringify(v)) : localStorage.removeItem("gp_session"); }catch(e){} },
  };
  let session = store.get();
  const keep = d => { if(d && d.access_token){ if(!d.expires_at) d.expires_at = Math.floor(Date.now()/1000) + (+d.expires_in||3600); session = d; store.set(d); } return d; };
  async function raw(path, {method="GET", body, token, prefer}={}){
    const h = {"apikey": KEY, "Content-Type": "application/json"};
    if(token) h["Authorization"] = "Bearer " + token;
    if(prefer) h["Prefer"] = prefer;
    const r = await fetch(URL_ + path, {method, headers: h, body: body ? JSON.stringify(body) : undefined});
    const text = await r.text();
    let data = null; try{ data = text ? JSON.parse(text) : null; }catch(e){}
    if(!r.ok) throw Object.assign(new Error((data && (data.msg || data.message || data.error_description || data.error)) || ("HTTP " + r.status)), {status: r.status, code: data && (data.code || data.error_code)});
    return data;
  }
  // 登录凭证一小时过期，快过期时自动续上
  async function fresh(){
    if(!session) return null;
    if((session.expires_at||0)*1000 > Date.now() + 60000) return session.access_token;
    try{ keep(await raw("/auth/v1/token?grant_type=refresh_token", {method: "POST", body: {refresh_token: session.refresh_token}})); return session.access_token; }
    catch(e){ session = null; store.set(null); return null; }
  }
  async function req(path, opts={}){
    const token = opts.auth ? await fresh() : null;
    return raw(path, {...opts, token});
  }
  // 谷歌登录、邮件里的确认链接回来时，登录信息在网址 # 后面，取出来存好再把网址清干净
  const fromHash = (function(){
    const h = new URLSearchParams(location.hash.slice(1));
    if(h.get("access_token")){
      keep({access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: h.get("expires_in"), expires_at: +h.get("expires_at") || 0});
      try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}
      return {type: h.get("type") || "login"};
    }
    if(h.get("error")){
      try{ history.replaceState(null, "", location.pathname + location.search); }catch(e){}
      return {error: h.get("error_description") || h.get("error")};
    }
    return null;
  })();
  return {
    submitSignup: row => req("/rest/v1/signups", {method: "POST", body: row, auth: true, prefer: "return=minimal"}),
    // 账号
    fromHash: () => fromHash,
    signIn: async (email, password) => keep(await raw("/auth/v1/token?grant_type=password", {method: "POST", body: {email, password}})),
    signUp: async (email, password, back) => keep(await raw("/auth/v1/signup" + (back ? "?redirect_to=" + encodeURIComponent(back) : ""), {method: "POST", body: {email, password}})),
    googleUrl: back => `${URL_}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(back)}`,
    recover: (email, back) => raw("/auth/v1/recover?redirect_to=" + encodeURIComponent(back), {method: "POST", body: {email}}),
    setPassword: async password => raw("/auth/v1/user", {method: "PUT", body: {password}, token: await fresh()}),
    signOut: () => { const t = session && session.access_token; session = null; store.set(null); if(t) raw("/auth/v1/logout", {method: "POST", token: t}).catch(()=>{}); },
    session: () => session,
    user: async () => { const t = await fresh(); if(!t) return null; try{ return await raw("/auth/v1/user", {token: t}); }catch(e){ if(e.status===401||e.status===403){ session=null; store.set(null); } return null; } },
    profile: async uid => (await req(`/rest/v1/profiles?select=display_name,avatar_url,banned&user_id=eq.${uid}`, {auth: true}))[0] || null,
    saveName: (uid, display_name) => req("/rest/v1/profiles?on_conflict=user_id", {method: "POST", body: {user_id: uid, display_name}, auth: true, prefer: "resolution=merge-duplicates,return=minimal"}),
    // 显示名：自己改过的昵称 > 谷歌名字 > "新朋友"
    nameOf: (user, prof) => (prof && prof.display_name) || (user && user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || "新朋友",
    banAuthor: commentId => req("/rest/v1/rpc/ban_comment_author", {method: "POST", body: {c: commentId}, auth: true}),
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
    listSubmissions: () => req("/rest/v1/submissions?select=id,stop_no,season,kind,platform,url,title,note,status,created_at&order=created_at.desc", {auth: true}),
    setSubmissionStatus: (id, status) => req(`/rest/v1/submissions?id=eq.${encodeURIComponent(id)}`, {method: "PATCH", body: {status}, auth: true, prefer: "return=minimal"}),
    listLinks: () => req("/rest/v1/holder_links?select=*&order=stop_no.desc", {auth: true}),
    createLink: async (stop_no, season, label) => (await req("/rest/v1/holder_links", {method: "POST", body: {stop_no, season, label}, auth: true, prefer: "return=representation"}))[0],
    setLinkActive: (token, active) => req(`/rest/v1/holder_links?token=eq.${encodeURIComponent(token)}`, {method: "PATCH", body: {active}, auth: true, prefer: "return=minimal"}),
    // 社区：只有当周持有人（本期最新的有效链接）能发帖，所有人能评论
    holderInfo: async t => (await req("/rest/v1/rpc/holder_info", {method: "POST", body: {t}}))[0] || null,
    uploadImage: async (token, blob) => {
      const fd = new FormData(); fd.append("token", token); fd.append("file", blob, "photo.jpg");
      const r = await fetch(URL_ + "/functions/v1/upload-image", {method: "POST", headers: {"apikey": KEY}, body: fd});
      const d = await r.json().catch(() => ({}));
      if(!r.ok || !d.url) throw Object.assign(new Error(d.error || ("HTTP " + r.status)), {status: r.status});
      return d.url;
    },
    createPost: row => req("/rest/v1/posts", {method: "POST", body: row, prefer: "return=minimal"}),
    posts: (season, stopNo) => req(`/rest/v1/posts?select=id,stop_no,season,body,images,created_at&season=eq.${encodeURIComponent(season)}` + (stopNo ? `&stop_no=eq.${stopNo}` : "") + "&order=created_at.desc&limit=50"),
    comments: ids => ids.length ? req(`/rest/v1/comments?select=id,post_id,nickname,avatar_url,body,created_at&post_id=in.(${ids.map(encodeURIComponent).join(",")})&order=created_at.asc`) : Promise.resolve([]),
    addComment: row => req("/rest/v1/comments?select=id,post_id,nickname,avatar_url,body,created_at", {method: "POST", body: row, auth: true, prefer: "return=representation"}).then(r => r && r[0]),
    listPosts: () => req("/rest/v1/posts?select=id,stop_no,season,body,images,status,created_at&order=created_at.desc&limit=100", {auth: true}),
    listComments: () => req("/rest/v1/comments?select=id,post_id,nickname,body,status,created_at&order=created_at.desc&limit=300", {auth: true}),
    setPostStatus: (id, status) => req(`/rest/v1/posts?id=eq.${encodeURIComponent(id)}`, {method: "PATCH", body: {status}, auth: true, prefer: "return=minimal"}),
    setCommentStatus: (id, status) => req(`/rest/v1/comments?id=eq.${encodeURIComponent(id)}`, {method: "PATCH", body: {status}, auth: true, prefer: "return=minimal"}),
    setStatus: (id, status) => req(`/rest/v1/signups?id=eq.${encodeURIComponent(id)}`, {method: "PATCH", body: {status}, auth: true, prefer: "return=minimal"}),
  };
})();
