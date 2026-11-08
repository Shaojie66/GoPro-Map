# GoPro 流浪地图

一台相机，一人一周，从布里斯托出发，慢慢走遍英国。

网页地址：https://shaojie66.github.io/GoPro-Map/ （区分大小写）

## 每周更新

在 `index.html` 里找到 `const STOPS = [`，交接后在末尾加一行：

```js
{start:"2026-11-13", city:"oxford", xhs:"小红书昵称", url:"", avatar:"键名"},
```

头像图片以 data URI 的形式放在 `AVATARS` 里。页面只放已经公开的周次，不放未来行程。

## 新官网（建设中，在 `site/` 文件夹）

`site/` 是流浪计划官网第一阶段：首页、地图、每一站、关于、报名说明。上线前不影响上面的地图网址。

每周更新只改 `site/assets/data.js`：在 `stops` 末尾加一行，头像图片放进 `site/assets/avatars/`。作品链接写在这一站的 `works` 里。

### 报名表（第二阶段）

- 报名页 `site/join.html` 把报名存进 Supabase 项目 `gopro-liulang`（伦敦机房）的 `signups` 表。任何人只能提交，看不到别人的报名。
- 后台 `site/admin.html`：管理员登录后看报名、改状态。新账号要先加进 `admins` 表才能看到数据。
- 也可以直接在 Supabase 网页的 Table Editor 里看 `signups`。
