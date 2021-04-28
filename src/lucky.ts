import { registerMiddleware } from './index';

// 幸运值缓存
let map: { [qq: number]: number } = {};

registerMiddleware('今日人品', async (msg, _api) => {
  const str = msg.plain.trim();
  if (str === '今日人品') {
    if (typeof map[msg.sender.id] === 'undefined') {
      map[msg.sender.id] = Math.floor(Math.random() * 100);
    }
    const val = map[msg.sender.id];
    const rawHead = ` 嗨~您今天的人品值是 ${val}~`;
    if (val <= 30) {
      msg.reply(rawHead + '好像运气不太好呢~', true);
    } else if (val <= 60) {
      msg.reply(rawHead + '看起来运气还可以~', true);
    } else {
      msg.reply(rawHead + '人气爆表了耶，快去抽卡吧~', true);
    }
    return true;
  }
  return false;
});
