import { registerMiddleware } from './index';

// 复读冷却流水
let lastMessage: string = '';
let hasSaidMessage: string[] = [];

registerMiddleware('复读机', '复读机模块', async (msg, api) => {
  const str = msg.plain.trim();
  if (lastMessage === msg.plain.trim() && hasSaidMessage.indexOf(str) < 0) {
    hasSaidMessage.push(str);
    api.sendGroupMessage(str, msg.sender.group.id);
    setInterval(() => {
      hasSaidMessage = hasSaidMessage.filter(n => n !== str);
    }, 3 * 60 * 1000);
  }
  lastMessage = msg.plain.trim();
  return false;
});
