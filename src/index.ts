// Mirai 初始化
import Mirai from 'mirai-ts';
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
      for (const { middleware, enable } of middlewares) {
        if (enable) {
          if (await middleware(msg, mirai.api)) {
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

// 针对各个用户的信息存贮设施，使用 Mongodb 数据库存储
import { connect, connection as db } from 'mongoose';
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

// 模块管理器
type IMiddleware = (
  msg: GroupMessage, api: Mirai['api']
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
import './moduleManager';
import './greeting';
import './imageLibrary';
import './judgement';
import './messageKeeper';
import './messageLibrary';
import './permissionForwarding';
import './phonograph';
import './repeater';
import './ticketCollector';
import './twitterMonitor';
import './welcome';
import './linkParser';
import './lucky';
