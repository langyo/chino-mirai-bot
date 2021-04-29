import { registerMiddleware } from './index';

// 当天记录
let rank: { date: Date, qq: number }[] = [];
// 防止重复刷屏用的反复读保护
let ban: number[] = [];

// 正则常量
const morningRegExp = /^((早)|(.*(早安)|(早上好)|(哦哈呦)|(喵帕斯)|(贵安)))$/;
const nightRegExp = /^.*晚安.*$/;

registerMiddleware('早安', async (msg, _api, _dbObj) => {
  const qq = msg.sender.id;

  if (morningRegExp.test(msg.plain)) {
    if (ban.indexOf(qq) >= 0) {
      return;
    }
    if (rank.map(n => n.qq).indexOf(qq) >= 0) {
      msg.reply('您已经说过早安了哦~', true);
      // 一小时内不再回复
      ban.push(qq);
      setInterval(() => {
        ban = ban.filter(n => n !== qq);
      }, 60 * 60 * 1000);
    } else {
      const now = new Date();
      if (now.getHours() <= 8 && now.getHours() >= 5) {
        msg.reply(` 早~${rank.length < 30 ? `您是第${rank.length + 1}个起床的哦~` : ''}`, true);
        rank.push({ date: now, qq });
      } else if (now.getHours() < 5) {
        msg.reply(` 好像还太早了吧？`, true);
      } else if (now.getHours() > 8 && now.getHours() <= 10) {
        msg.reply(` 早~起的有点晚了哦~`, true);
        // 一小时内不再回复
        ban.push(qq);
        setInterval(() => {
          ban = ban.filter(n => n !== qq);
        }, 60 * 60 * 1000);
      } else {
        msg.reply(` 现在好像不是时候吧……`, true);
        // 一小时内不再回复
        ban.push(qq);
        setInterval(() => {
          ban = ban.filter(n => n !== qq);
        }, 60 * 60 * 1000);
      }
    }
    return true;
  } else {
    return false;
  }
});


registerMiddleware('晚安', async (msg, _api, _dbObj) => {
  const qq = msg.sender.id;

  if (nightRegExp.test(msg.plain)) {
    if (ban.indexOf(qq) >= 0) {
      return;
    }
    if (rank.map(n => n.qq).indexOf(qq) >= 0) {
      msg.reply('咦？您原来还没睡的嘛~赶快睡吧~', true);
      // 一小时内不再回复
      ban.push(qq);
      setInterval(() => {
        ban = ban.filter(n => n !== qq);
      }, 60 * 60 * 1000);
    } else {
      const now = new Date();
      if (now.getHours() >= 20 && now.getHours() <= 23) {
        msg.reply(` 晚安~做个好梦~`, true);
        rank.push({ date: now, qq });
      } else if (now.getHours() < 5) {
        msg.reply(` 晚安~通宵对身体不好哦，赶紧睡吧~`, true);
        rank.push({ date: now, qq });
      } else {
        msg.reply(` 现在好像不是时候吧……`, true);
        // 一小时内不再回复
        ban.push(qq);
        setInterval(() => {
          ban = ban.filter(n => n !== qq);
        }, 60 * 60 * 1000);
      }
    }
    return true;
  } else {
    return false;
  }
});
