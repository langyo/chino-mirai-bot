import { registerMiddleware } from './index';

// 当天记录
let rank: { date: Date, qq: number }[] = [];
// 防止重复刷屏用的反复读保护
let ban: number[] = [];

registerMiddleware('早安', '早安问候模块', async (msg, _api, _state) => {
  const qq = msg.sender.id;
  const reply = msg.reply;

  if (/^.*(早)|(早安)|(早上好)|(哦哈呦)|(喵帕斯)$/.test(msg.plain)) {
    if (ban.indexOf(qq) >= 0) {
      return;
    }
    if (rank.map(n => n.qq).indexOf(qq) >= 0) {
      reply(' 你已经说过早安了哦~', true);
      // 一小时内不再回复
      ban.push(qq);
      setInterval(() => {
        ban = ban.filter(n => n !== qq);
      }, 60 * 60 * 1000);
    } else {
      const now = new Date();
      if (now.getHours() <= 8 && now.getHours() >= 5) {
        reply(` 早~${rank.length < 30 ? `你是第${rank.length + 1}个起床的哦~` : ''}`, true);
        rank.push({ date: now, qq });
      } else if (now.getHours() < 5) {
        reply(` 好像还太早了吧？`, true);
      } else if (now.getHours() > 8 && now.getHours() <= 10) {
        reply(` 早~起的有点晚了哦~`, true);
        // 一小时内不再回复
        ban.push(qq);
        setInterval(() => {
          ban = ban.filter(n => n !== qq);
        }, 60 * 60 * 1000);
      } else {
        reply(` 现在好像不是时候吧……`, true);
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


registerMiddleware('晚安', '晚安问候模块', async (msg, _api, _state) => {
  const qq = msg.sender.id;
  const reply = msg.reply;

  if (/^.*晚安.*$/.test(msg.plain)) {
    if (ban.indexOf(qq) >= 0) {
      return;
    }
    if (rank.map(n => n.qq).indexOf(qq) >= 0) {
      reply(' 咦？你原来还没睡的嘛~赶快睡吧~', true);
      // 一小时内不再回复
      ban.push(qq);
      setInterval(() => {
        ban = ban.filter(n => n !== qq);
      }, 60 * 60 * 1000);
    } else {
      const now = new Date();
      if (now.getHours() >= 20 && now.getHours() <= 23) {
        reply(` 晚安~做个好梦~`, true);
        rank.push({ date: now, qq });
      } else if (now.getHours() < 5) {
        reply(` 晚安~通宵对身体不好哦，赶紧睡吧~`, true);
        rank.push({ date: now, qq });
      } else {
        reply(` 现在好像不是时候吧……`, true);
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
