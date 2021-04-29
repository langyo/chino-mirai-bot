import { Message } from 'mirai-ts';
import { Schema, model } from 'mongoose';
import {
  registerMiddleware, log, ROBOT_QQ,
  MessageChainModel, PlainMessageModel, MediaMessageModel,
  AtMessageModel, FaceMessageModel, RichMessageModel
} from './index';

const MessageInboxModel = model('messageInbox', new Schema({
  sender: Number,
  receiver: { type: Number, index: true },
  content: Schema.Types.ObjectId
}));

const shortInboxRegExp = /^(留言)|(提醒).*/;

registerMiddleware('留言', async (msg, _api, dbObj) => {
  // 留言请求响应
  if (
    msg.messageChain[1]?.type === 'Plain' &&
    shortInboxRegExp.test(msg.messageChain[1].text) &&
    msg.messageChain[2]?.type === 'At'
  ) {
    if (msg.messageChain[2].target === ROBOT_QQ) {
      log.info(`已拦截对机器人自身的提醒创建请求`);
      msg.reply(' 这样是不可以的哦~', true);
    } else {
      await (new MessageInboxModel({
        sender: msg.sender.id,
        receiver: msg.messageChain[2].target,
        content: dbObj._id
      })).save();
      log.info(`已为 ${msg.sender.id} 创建提醒：${msg.messageChain.slice(3)}`);
      msg.reply(' 提醒创建成功~', true);
    }
    return true;
  }

  // 留言目标响应
  const query = await MessageInboxModel.find({ receiver: msg.sender.id }).exec();
  if (query.length > 0) {
    for (const { sender, content: id } of query as any as {
      sender: number, receiver: number, content: Schema.Types.ObjectId
    }[]) {
      const parsedContent = [];
      for (const { id: subId, type } of (await MessageChainModel.findById(id).exec() as any).messageChain.slice(2)) {
        switch (type) {
          case 'Plain':
            const queryPlain = await PlainMessageModel.findById(subId).exec() as any;
            parsedContent.push(Message.Plain(queryPlain.text));
            break;
          case 'Face':
            const queryFace = await FaceMessageModel.findById(subId).exec() as any;
            parsedContent.push(Message.Face(queryFace.faceId, queryFace.name));
            break;
          case 'Image':
            const queryMedia = await MediaMessageModel.findById(subId).exec() as any;
            parsedContent.push(Message.Image(queryMedia.id, queryMedia.url));
            break;
          case 'At':
            const queryAt = await AtMessageModel.findById(subId).exec() as any;
            parsedContent.push(Message.At(queryAt.target));
            break;
          case 'AtAll':
            // 为防止有人故意让机器人频繁 at 全体成员，所以在重新发送转发消息时，此消息会被过滤为纯文本
            parsedContent.push(Message.Plain(' @全体成员 '));
            break;
        }
      }
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

const LongMessageInboxModel = model('longMessageInbox', new Schema({
  sender: Number,
  receiver: { type: Number, index: true },
  content: [Schema.Types.ObjectId]
}));

const longInboxRegExp = /^长留言.*/;
const recordingMap: {
  [qq: number]: {
    target: number, content: Schema.Types.ObjectId[]
  }
} = {};

registerMiddleware('长留言', async (msg, _api, dbObj) => {
  // 留言请求响应
  if (
    msg.messageChain[1]?.type === 'Plain' &&
    longInboxRegExp.test(msg.messageChain[1].text) &&
    msg.messageChain[2]?.type === 'At'
  ) {
    if (msg.messageChain[2].target === ROBOT_QQ) {
      log.info(`已拦截对机器人自身的提醒创建请求`);
      msg.reply(' 这样是不可以的哦~', true);
    } else {
      recordingMap[msg.sender.id] = { target: msg.messageChain[2].target, content: [] };
      msg.reply(' 姬姬开始录制留言喽~单独说出"over"以结束留言~', true);
    }
    return true;
  } else if (recordingMap[msg.sender.id]) {
    if (msg.plain.trim() === 'over') {
      log.info(`已响应 ${msg.sender.id} 的长留言结束请求`);
      await (new LongMessageInboxModel({
        sender: msg.sender.id, receiver: recordingMap[msg.sender.id].target,
        content: recordingMap[msg.sender.id].content
      })).save();
      delete recordingMap[msg.sender.id];
      msg.reply(' 提醒创建成功~', true);
    } else {
      log.info(`已响应 ${msg.sender.id} 的长留言内容追加：${msg.messageChain}`);
      recordingMap[msg.sender.id].content.push(dbObj._id);
    }
    return true;
  }

  // 留言目标响应
  const query = await LongMessageInboxModel.find({ receiver: msg.sender.id }).exec();
  if (query.length > 0) {
    for (const { sender, content: ids } of query as any as {
      sender: number, receiver: number, content: Schema.Types.ObjectId[]
    }[]) {
      msg.reply([
        Message.Plain(' 来自'),
        Message.At(sender),
        Message.Plain(`的长留言（共${ids.length}条）：`)
      ], true);
      log.debug(`Outside ${ids.join(', ')}`);
      for (const id of ids) {
        const parsedContent = [];
        for (const { id: subId, type } of (await MessageChainModel.findById(id).exec() as any).messageChain) {
          log.debug(`Chain ${subId} ${type}`);
          switch (type) {
            case 'Plain':
              const queryPlain = await PlainMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.Plain(queryPlain.text));
              break;
            case 'Face':
              const queryFace = await FaceMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.Face(queryFace.faceId, queryFace.name));
              break;
            case 'Poke':
              const queryPoke = await FaceMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.Poke(queryPoke.name));
              break;
            case 'Image':
            case 'FlashImage':
              const queryImage = await MediaMessageModel.findById(subId).exec() as any;
              if (type === 'FlashImage') {
                parsedContent.push(Message.Plain('(闪照消息)'));
              }
              parsedContent.push(Message.Image(queryImage.id, queryImage.url));
              break;
            case 'Voice':
              const queryVoice = await MediaMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.Voice(queryVoice.id, queryVoice.url));
              break;
            case 'Xml':
              const queryXml = await RichMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.Xml(queryXml.content));
              break;
            case 'Json':
              const queryJson = await RichMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.Json(queryJson.content));
              break;
            case 'App':
              const queryApp = await RichMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.App(queryApp.content));
              break;
            case 'At':
              const queryAt = await AtMessageModel.findById(subId).exec() as any;
              parsedContent.push(Message.At(queryAt.target));
              break;
            case 'AtAll':
              // 为防止有人故意让机器人频繁 at 全体成员，所以在重新发送转发消息时，此消息会被过滤为纯文本
              parsedContent.push(Message.Plain(' @全体成员 '));
              break;
          }
        }
        log.debug(`Inside ${id} ${parsedContent}`);
        msg.reply(parsedContent);
      }
    }
    // 根据之前的 query 结果逐个移除已经处理过的提醒
    // 为避免因同时有留言者和接收者发送消息导致两次查询不一致的情况，故这里的数据移除只使用先前的查询结果
    for (const _id of query) {
      await LongMessageInboxModel.findById(_id).deleteOne();
    }
  }
  return false;
});
