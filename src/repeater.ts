import { registerMiddleware } from './index';

// 复读冷却流水
let map: {
  [content: string]: {
    times: number,
    hasBotSaid: boolean
  }
} = {};

registerMiddleware('复读机', '复读机模块', async (msg, api) => {
  if (msg.messageChain[1].type === 'Plain') {
    const content = msg.messageChain[1].text.trim();
    if (content.length <= 30 && Object.keys(map).indexOf(content) >= 0) {
      map[content].times += 1;
      if (map[content].times > 1 && !map[content].hasBotSaid) {
        map[content].hasBotSaid = true;
        api.sendGroupMessage(msg.plain.trim(), msg.sender.group.id);
        setInterval(() => {
          delete map[content];
        }, 3 * 60 * 1000);
      }
    } else {
      map[content] = { times: 1, hasBotSaid: false };
    }
  }
  return false;
});
