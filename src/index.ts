// Mirai 初始化
import Mirai, { MessageType } from 'mirai-ts';
import { GroupMessage } from 'mirai-ts/dist/types/message-type';

export const ROBOT_QQ = 1931838621;
const mirai = new Mirai({
  host: '127.0.0.1',
  port: 9233,
  authKey: '114514aaaaaaaa',
  enableWebsocket: true,
});
export const log = mirai.logger;

(async () => {
  await mirai.link(ROBOT_QQ);
  mirai.on('message', async msg => {
    if (msg.type === 'GroupMessage') {
      log.info(`来自 ${msg.sender.id} 的消息：${msg.plain.trim()}`);
      const dbObj = await saveMessage(msg);
      for (const { module, middleware, enable } of middlewares) {
        if (enable) {
          if (await middleware(msg, mirai.api, dbObj)) {
            log.info(`该消息已被"${module}"模块处理`);
            break;
          }
        }
      }
    }
  });
  mirai.listen();
})();

// 针对全局的信息存贮设施，使用本地文件系统，以 JSON 存储
import { readFileSync, writeFileSync, accessSync } from 'fs';
import { join } from 'path';
const GLOBAL_CONFIG_FILE_PATH = join(__dirname, '../config/robotGlobalSettings.json');
try {
  accessSync(GLOBAL_CONFIG_FILE_PATH);
} catch (e) {
  log.success('新的全局配置文件已建立');
  writeFileSync(GLOBAL_CONFIG_FILE_PATH, JSON.stringify({}));
}

let globalState = JSON.parse(readFileSync(GLOBAL_CONFIG_FILE_PATH, 'utf-8'));
log.success('全局配置文件已准备完毕');
export function getGlobalState(module: string, key: string, defaultVal?: any) {
  if (
    typeof globalState[module] !== 'undefined' &&
    typeof globalState[module][key] !== 'undefined'
  ) {
    return globalState[module][key];
  } else {
    setGlobalState(module, key, defaultVal);
    return defaultVal;
  }
}
export function setGlobalState(module: string, key: string, value: any) {
  if (typeof globalState[module] === 'undefined') {
    globalState[module] = {};
  }
  globalState[module][key] = value;
  writeFileSync(GLOBAL_CONFIG_FILE_PATH, JSON.stringify(globalState));
}

// 针对各个用户的信息存贮设施，使用 MongoDB 数据库存储
import { connect, connection as db, Schema, Document, model } from 'mongoose';
connect('mongodb://localhost/chino-mirai-bot', {
  useNewUrlParser: true, useUnifiedTopology: true
});
db.once('open', () => {
  log.success('本地数据库已建立连接');
});
db.on('error', err => {
  log.error(err);
});
export { db };

export const PlainMessageModel = model('plainMessage', new Schema({
  text: { type: String, sparse: true }
}));
export const AtMessageModel = model('atMessage', new Schema({
  target: Number                            // 如果为 0 则视作 at 全体成员
}));
export const FaceMessageModel = model('faceMessage', new Schema({
  faceId: Number,
  name: String,
  type: { type: String, enum: ['Face', 'Poke'] }
}));
export const MediaMessageModel = model('mediaMessage', new Schema({
  id: String,
  url: String,
  type: { type: String, enum: ['Image', 'FlashImage', 'Voice'] }
}));
export const RichMessageModel = model('richMessage', new Schema({
  content: String,
  type: { type: String, enum: ['Xml', 'Json', 'App'] }
}));

export const MessageChainModel = model('message', new Schema({
  id: { type: Number, index: true },
  group: { type: Number, index: true },   // 如果为 0 则视作私聊
  date: { type: Number, unique: true },
  quote: Number,                          // 如果为 0 则视作没有引用其它消息
  messageChain: [new Schema({
    id: Schema.Types.ObjectId,
    type: { type: String, enum: ['plain', 'at', 'face', 'media', 'rich'] }
  })]
}));

async function saveMessage(msg: GroupMessage) {
  const messageChain = [];
  for (const obj of msg.messageChain) {
    switch (obj.type) {
      case 'Plain':
        messageChain.push({
          type: 'plain',
          id: (await (new PlainMessageModel({ text: obj.text })).save())._id
        });
        break;
      case 'At':
      case 'AtAll':
        messageChain.push({
          type: 'at',
          id: (await (new AtMessageModel({
            target: (obj as MessageType.At).target || 0
          })).save())._id
        });
        break;
      case 'Face':
      case 'Poke':
        messageChain.push({
          type: 'at',
          id: (await (new FaceMessageModel({
            faceId: (obj as MessageType.Face).faceId || 0,
            name: obj.name
          })).save())._id
        });
        break;
      case 'Image':
      case 'FlashImage':
      case 'Voice':
        messageChain.push({
          type: 'at',
          id: (await (new MediaMessageModel({
            id: (obj as MessageType.Image).imageId
              || (obj as MessageType.FlashImage).imageId
              || (obj as MessageType.Voice).voiceId,
            url: obj.url,
            type: obj.type
          })).save())._id
        });
        break;
      case 'Xml':
      case 'Json':
      case 'App':
        messageChain.push({
          type: 'rich',
          id: (await (new RichMessageModel({
            content: (obj as MessageType.Xml).xml
              || (obj as MessageType.Json).json
              || (obj as MessageType.App).content,
            type: obj.type
          })).save())._id
        });
        break;
      default:
        break;
    }
  }
  return await (new MessageChainModel({
    id: msg.messageChain[0].id,
    group: msg.sender.group.id,
    date: msg.messageChain[0].time,
    quote: (
      (msg.messageChain.find(n => n.type === 'Quote') as MessageType.Quote) || { id: 0 }
    ).id,
    messageChain
  })).save();
}

// 模块管理器
type IMiddleware = (
  msg: GroupMessage, api: Mirai['api'], dbObj: Document
) => Promise<boolean>;

export let middlewares: {
  module: string,
  enable: boolean,
  middleware: IMiddleware
}[] = [];

export function registerMiddleware(
  module: string,
  middleware: IMiddleware
) {
  middlewares.push({
    module, middleware,
    enable: getGlobalState('moduleManager', module, true)
  });
}

// 批量载入模块
import './messageLibrary';
import './moduleManager';
import './greeting';
import './imageLibrary';
import './judgement';
import './permissionForwarding';
import './phonograph';
import './ticketCollector';
import './twitterMonitor';
import './welcome';
import './linkParser';
import './lucky';
import './repeater';
