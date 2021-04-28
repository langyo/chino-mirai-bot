import { Message } from 'mirai-ts';
import { Schema, model } from 'mongoose';
import { SingleMessage } from 'mirai-ts/dist/types/message-type';
import {
  registerMiddleware, log,
  MessageChainModel, PlainMessageModel, MediaMessageModel, AtMessageModel, FaceMessageModel
} from './index';

const MessageInboxModel = model('messageInbox', new Schema({
  sender: Number,
  receiver: { type: Number, index: true },
  content: Schema.Types.ObjectId
}));

const commandRegExp = /^(留言)|(提醒).*/;

registerMiddleware('留言', async (msg, _api, dbObj) => {
  if (
    msg.messageChain[1]?.type === 'Plain' &&
    commandRegExp.test(msg.messageChain[1].text) &&
    msg.messageChain[2]?.type === 'At'
  ) {
    await (new MessageInboxModel({
      sender: msg.sender.id,
      receiver: msg.messageChain[2].target,
      content: dbObj._id
    })).save();
    log.info(`已为 ${msg.sender.id} 创建提醒：${msg.messageChain.slice(3)}`);
    msg.reply(' 提醒创建成功~', true);
    return true;
  }
  const query = await MessageInboxModel.find({ receiver: msg.sender.id }).exec();
  if (query.length > 0) {
    for (const { sender, content: id } of query as any as {
      sender: number, receiver: number, content: Schema.Types.ObjectId
    }[]) {
      const parsedContent = await (async () => {
        let ret = [];
        for (const { id: subId, type } of (await MessageChainModel.findById(id).exec() as any).messageChain.slice(2)) {
          switch (type) {
            case 'Plain':
              const queryPlain = await PlainMessageModel.findById(subId).exec() as any;
              ret.push(Message.Plain(queryPlain.text));
              break;
            case 'Face':
              const queryFace = await FaceMessageModel.findById(subId).exec() as any;
              ret.push(Message.Face(queryFace.faceId, queryFace.name));
              break;
            case 'Image':
              const queryMedia = await MediaMessageModel.findById(subId).exec() as any;
              ret.push(Message.Image(queryMedia.id, queryMedia.url));
              break;
            case 'At':
              const queryAt = await AtMessageModel.findById(subId).exec() as any;
              ret.push(Message.At(queryAt.target));
              break;
            case 'AtAll':
              // 为防止有人故意让机器人频繁 at 全体成员，所以在重新发送转发消息时，此消息会被过滤为纯文本
              ret.push(Message.Plain(' @全体成员 '));
              break;
          }
        }
        return ret;
      })();
      msg.reply([
        Message.Plain(' 来自'),
        Message.At(sender),
        Message.Plain('的留言：\n'),
        ...parsedContent
      ], true);
    }
    // 根据之前的 query 结果逐个移除已经处理过的提醒
    // 为避免因同时有留言者和接收者发送消息导致两次查询不一致的情况，故这里的数据移除只使用先前的查询结果
    for (const _id of query) {
      await MessageInboxModel.findById(_id).deleteOne();
    }
  }
  return false;
});
