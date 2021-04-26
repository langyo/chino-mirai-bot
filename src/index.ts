// ------
// Mirai 初始化
// ------
import Mirai from 'mirai-ts';
import { GroupMessage } from 'mirai-ts/dist/types/message-type';

const mirai = new Mirai({
  host: '127.0.0.1',
  port: 9233,
  authKey: '114514aaaaaaaa',
  enableWebsocket: true,
});
export const log = mirai.logger;

(async () => {
  const ROBOT_QQ = 1931838621;

  await mirai.link(ROBOT_QQ);
  mirai.on('message', async msg => {
    if (msg.type === 'GroupMessage') {
      if (msg.isAt(ROBOT_QQ)) {
        switch (msg.plain.trim()) {
          case '管理':
            mirai.api.sendGroupMessage(`当前机器人运行状态正常
在运行的组件列表: ${middlewares.map(n => n.module).join(', ')}`, msg.sender.group.id);
            break;
          case '?':
            msg.reply(` 指令提示暂不可用`, true);
            break;
          default:
        }
      } else {
        let i = 0;
        while (!await middlewares[i].middleware(msg, mirai.api)) {
          i += 1;
          if (middlewares.length <= i) {
            break;
          }
        }
      }
    }
  });
  mirai.listen();
})();

// ------
// 针对全局的信息存贮设施，使用本地文件系统，以 JSON 存储
// ------
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
export function getGlobalState(module: string, key: string) {
  if (
    typeof globalState[module] !== 'undefined' &&
    typeof globalState[module][key] !== 'undefined'
  ) {
    return globalState[module][key];
  } else {
    return undefined;
  }
}
export function setGlobalState(module: string, key: string, value: string) {
  if (typeof globalState[module] === 'undefined') {
    globalState[module] = {};
  }
  globalState[module][key] = value;
  writeFileSync(GLOBAL_CONFIG_FILE_PATH, JSON.stringify(globalState));
}

// ------
// 针对各个用户的信息存贮设施，使用 Mongodb 数据库存储
// ------
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

// ------
// 模块管理器
// ------
type ITrigger = (
  args: string[], msg: GroupMessage, api: Mirai['api']
) => Promise<void>;
type IMiddleware = (
  msg: GroupMessage, api: Mirai['api']
) => Promise<boolean>;

let middlewares: {
  module: string,
  description: string,
  middleware: IMiddleware
}[] = [];

export function registerMiddleware(
  module: string,
  description: string,
  middleware: IMiddleware
) {
  middlewares.push({ module, description, middleware });
}

// ------
// 批量载入模块
// ------
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
