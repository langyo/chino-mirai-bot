import Mirai from 'mirai-ts';
import { GroupMessage } from 'mirai-ts/dist/types/message-type';

const qq = 1931838621;

const mirai = new Mirai({
  host: '127.0.0.1',
  port: 9233,
  authKey: '114514aaaaaaaa',
  enableWebsocket: true,
});

interface IConfigTools {
  get(qq: number, key: string): string,
  getGlobal(key: string): string,
  set(qq: number, key: string, val: string): void,
  setGlobal(key: string, val: string): void
}

function configToolsConstructor(moduleName: string): Readonly<IConfigTools> {
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

type ITrigger = (
  args: string[], msg: GroupMessage, ctx: Mirai, config: IConfigTools
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

export function registerGroupMessage(
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

import '../goodMorning';
import '../imageLibrary';
import '../judgement';
import '../messageKeeper';
import '../messageLibrary';
import '../phonograph';
import '../repeater';
import '../ticketCollector';
import '../twitterMonitor';
import '../qrcodeParser';

(async () => {
  await mirai.link(qq);
  mirai.on('message', msg => {
    if (msg.type === 'GroupMessage') {
      switch (msg.plain) {
        case '管理指令提示':
          msg.reply(`模块管理器暂不可用`, true);
          break;
        case '指令提示':
          msg.reply(`指令提示暂不可用`, true);
          break;
        default:
          const args = msg.plain.split(' ');
          for (const moduleName of Object.keys(triggers)) {
            if (Object.keys(triggers[moduleName]).indexOf(args[0]) >= 0) {
              if (Object.keys(triggers[moduleName][args[0]]).indexOf(args[1]) >= 0) {
                triggers[moduleName][args[0]][args[1]].trigger(
                  args.slice(2), msg, mirai, configToolsConstructor(moduleName)
                );
                break;
              } else {
                triggers[moduleName][args[0]]['*'].trigger(
                  args.slice(1), msg, mirai, configToolsConstructor(moduleName)
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
