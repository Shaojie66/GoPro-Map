# GoPro 流浪地图

一台相机，一人一周，从布里斯托出发，慢慢走遍英国。

网页地址：https://shaojie66.github.io/GoPro-Map/ （区分大小写）

## 每周更新

在 `index.html` 里找到 `const STOPS = [`，交接后在末尾加一行：

```js
{start:"2026-11-13", city:"oxford", xhs:"小红书昵称", url:"", avatar:"键名"},
```

头像图片以 data URI 的形式放在 `AVATARS` 里。页面只放已经公开的周次，不放未来行程。
