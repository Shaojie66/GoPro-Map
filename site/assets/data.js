// 网站内容都在这一个文件里。每周五交接后在 STOPS 末尾加一行，就会同时更新首页、地图和站点页。
// 隐私：只放已经开始的周次，不放未来行程、交接地点或学校。
// works：这一站的作品链接，platform 用 "小红书" / "抖音" / "B站"。
// avatar：头像文件名（放在 assets/avatars/ 里），不想露脸的同学可以留空。
// nextDir：下一站的大致方向（正北 0、顺时针），地图只画虚线和问号。
window.GP = {
  season: "第一期",
  launch: {date: "2026-11-06", city: "bristol"},
  host: {name: "奶盖", avatar: "naigai.jpg"},
  stops: [
    {start: "2026-11-06", city: "bristol", xhs: "otter", avatar: "otter.jpg", nextDir: 70,
     note: "", works: []},
  ],
  // 报名：第二期 2 月开始招募；报名表在下一阶段上线，现在先用私信和评论报名。
  join: {open: false, opens: "2027 年 2 月"},
};

GP.CITIES = {bristol:[558.9,1267.1], oxford:[686.8,1218.4], london:[795.4,1258.4], edinburgh:[501.1,531.1], leeds:[658.7,883.2], manchester:[592.1,935.6], nottingham:[696.3,1021.6], cambridge:[819.4,1144.2], cardiff:[502.0,1262.6]};
GP.ZH = {bristol:"布里斯托", oxford:"牛津", london:"伦敦", edinburgh:"爱丁堡", leeds:"利兹", manchester:"曼彻斯特", nottingham:"诺丁汉", cambridge:"剑桥", cardiff:"卡迪夫"};

// 以英国时间判断“今天”，只返回已经开始的站。
GP.today = new Intl.DateTimeFormat("en-CA", {timeZone: "Europe/London"}).format(new Date());
GP.shown = GP.stops.filter(s => GP.today >= s.start);
GP.cur = GP.shown.length - 1;
GP.md = s => { const [, m, d] = s.split("-"); return `${+m}.${+d}`; };
GP.avatarSrc = f => f ? `assets/avatars/${f}` : "";
