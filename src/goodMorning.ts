import { GroupMessage } from 'mirai-ts/dist/types/message-type';
import { registerCommand } from './index';

// 当天排名
let rank: { date: Date, qq: number }[] = [];
// 防止重复刷屏用的反复读保护
let ban: number[] = [];

function reply(qq: number, reply: GroupMessage['reply']) {
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
    } else if (now.getHours() > 8  && now.getHours() <= 10) {
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
}

registerCommand('早安', ['早'], '', async (_args, msg, _ctx, _config) => {
  reply(msg.sender.id, msg.reply);
});
registerCommand('早安', ['早安'], '', async (_args, msg, _ctx, _config) => {
  reply(msg.sender.id, msg.reply);
});
registerCommand('早安', ['早上好'], '', async (_args, msg, _ctx, _config) => {
  reply(msg.sender.id, msg.reply);
});
