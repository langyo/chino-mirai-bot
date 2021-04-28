import { Message } from 'mirai-ts';
import { Schema, model } from 'mongoose';
import { SingleMessage } from 'mirai-ts/dist/types/message-type';
import { registerMiddleware, log } from './index';

const MessageInboxModel = model('messageInbox', new Schema({
  sender: Number,
  receiver: Number,
  content: Schema.Types.ObjectId
}));

let map: {
  [qq: number]: {
    sender: number,
    content: SingleMessage[]
  }[]
} = {};

const commandRegExp = /^(留言)|(提醒).*/;

registerMiddleware('留言', async (msg, _api, _dbObj) => {
  if (
    msg.messageChain[1].type === 'Plain' &&
    commandRegExp.test(msg.messageChain[1].text) &&
    msg.messageChain[2].type === 'At'
  ) {
    log.info(`已为 ${msg.sender.id} 创建提醒：${msg.messageChain.slice(3)}`);
    map[msg.messageChain[2].target] = [
      ...(map[msg.messageChain[2].target] || []),
      {
        sender: msg.sender.id,
        content: msg.messageChain.slice(3)
      }
    ];
    msg.reply(' 提醒创建成功~', true);
    return true;
  }
  if (typeof map[msg.sender.id] !== 'undefined' && map[msg.sender.id].length > 0) {
    for (const { sender, content } of map[msg.sender.id]) {
      msg.reply([
        Message.Plain(' 来自'),
        Message.At(sender),
        Message.Plain('的留言：\n'),
        ...content
      ], true);
    }
    map[msg.sender.id] = [];
  }
  return false;
});
