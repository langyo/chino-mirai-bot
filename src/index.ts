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

(async () => {
  const ROBOT_QQ = 1931838621;

  await mirai.link(ROBOT_QQ);
  mirai.on('message', msg => {
    if (msg.type === 'GroupMessage') {
      switch (msg.plain) {
        case '管理指令提示':
          msg.reply(` 模块管理器暂不可用`, true);
          break;
        case '指令提示':
          msg.reply(` 指令提示暂不可用`, true);
          break;
        default:
          const args = msg.plain.split(' ');
          for (const moduleName of Object.keys(triggers)) {
            if (Object.keys(triggers[moduleName]).indexOf(args[0]) >= 0) {
              if (Object.keys(triggers[moduleName][args[0]]).indexOf(args[1]) >= 0) {
                triggers[moduleName][args[0]][args[1]].trigger(
                  args.slice(2), msg, mirai, stateManagerConstructor(moduleName)
                );
                break;
              } else {
                triggers[moduleName][args[0]]['*'].trigger(
                  args.slice(1), msg, mirai, stateManagerConstructor(moduleName)
                );
                break;
              }
            }
          }
          break;
      }
    }
  });
  mirai.listen();
})();

// ------
// 日志对象
// ------
export const log = mirai.logger;

// ------
// 针对全局的信息存贮设施，使用本地文件系统，以 JSON 存储
// ------
import { readFileSync, writeFileSync, accessSync } from 'fs';
import { join } from 'path';
const GLOBAL_CONFIG_FILE_PATH = join(__dirname, '../config/robotGlobalSettings.json');
try {
  accessSync(GLOBAL_CONFIG_FILE_PATH);
} catch (e) {
  log.info('新的全局配置文件已建立');
  writeFileSync(GLOBAL_CONFIG_FILE_PATH, JSON.stringify({}));
}

let globalState = JSON.parse(readFileSync(GLOBAL_CONFIG_FILE_PATH, 'utf-8'));
log.info('全局配置文件已准备完毕');
function getGlobalState(module: string, key: string) {
  if (
    typeof globalState[module] !== 'undefined' &&
    typeof globalState[module][key] !== 'undefined'
  ) {
    return globalState[module][key];
  } else {
    return undefined;
  }
}
function setGlobalState(module: string, key: string, value: string) {
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
  log.info('本地数据库已建立连接');
});
db.on('error', err => {
  log.error(err);
})

interface IStateManager {
  get(qq: number, key: string): string,
  getGlobal(key: string): string,
  set(qq: number, key: string, val: string): void,
  setGlobal(key: string, val: string): void
}

function stateManagerConstructor(moduleName: string): Readonly<IStateManager> {
  return Object.seal({
    get(qq: number, key: string): string {
      return '';
    },
    getGlobal(key: string): string {
      return '';
    },
    set(qq: number, key: string, val: string) {
    },
    setGlobal(key: string, val: string) {
    }
  });
}

// ------
// 模块管理器
// ------
type ITrigger = (
  args: string[], msg: GroupMessage, ctx: Mirai, state: IStateManager
) => Promise<void>;

let triggers: {
  [module: string]: {
    [commandHead: string]: {
      [subCommand in (string | '*')]: {
        description: string,
        trigger: ITrigger
      }
    }
  }
} = {};

export function registerCommand(
  moduleName: string,
  command: [string] | [string, string],
  description: string,
  trigger: ITrigger
) {
  if (typeof triggers[moduleName] === 'undefined') {
    triggers[moduleName] = {};
  }
  if (typeof triggers[moduleName][command[0]] === 'undefined') {
    triggers[moduleName][command[0]] = {};
  }
  if (typeof command[1] !== 'undefined') {
    if (typeof triggers[moduleName][command[0]][command[1]] === 'undefined') {
      triggers[moduleName][command[0]][command[1]] = {
        description, trigger
      };
    } else {
      throw Error(`重复的指令定义: ${moduleName}.${command[0]}.${command[1]}`);
    }
  } else {
    if (typeof triggers[moduleName][command[0]]['*'] === 'undefined') {
      triggers[moduleName][command[0]]['*'] = {
        description, trigger
      };
    } else {
      throw Error(`重复的指令定义: ${moduleName}.${command[0]}`);
    }
  }
}

// ------
// 批量载入模块
// ------
import './goodMorning';
import './imageLibrary';
import './judgement';
import './messageKeeper';
import './messageLibrary';
import './phonograph';
import './repeater';
import './ticketCollector';
import './twitterMonitor';
import './qrcodeParser';
import './counterWithdrawal';
import './permissionForwarding';
