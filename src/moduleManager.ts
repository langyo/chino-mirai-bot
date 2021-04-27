import {
  registerMiddleware, getGlobalState, setGlobalState,
  middlewares, ROBOT_QQ
} from './index';

registerMiddleware('模块管理', async (msg, api) => {
  if (msg.isAt(ROBOT_QQ)) {
    const str = msg.plain.trim();
    if (/^状态$/.test(str)) {
      api.sendGroupMessage(`当前在运行的模块列表:\n${middlewares.map(
        n => `${n.module}${getGlobalState(
          'moduleManager', n.module, true
        ) ? '' : '(已禁用)'}`
      ).join(', ')}`, msg.sender.group.id);
    } else if (/^打开模块/.test(str)) {
      const moduleName = /^打开模块 (.+)$/.exec(str)[1];
      if (middlewares.map(n => n.module).indexOf(moduleName) < 0) {
        msg.reply(` 不存在模块"${moduleName}"`, true);
      } else if (getGlobalState('moduleManager', moduleName, true)) {
        msg.reply(` 模块"${moduleName}"已经处于启用状态`, true);
      } else {
        setGlobalState('moduleManager', moduleName, true);
        middlewares[middlewares.findIndex(n => n.module === moduleName)].enable = true;
        msg.reply(` 模块"${moduleName}"已启用`, true);
      }
    } else if (/^关闭模块/.test(str)) {
      const moduleName = /^关闭模块 (.+)$/.exec(str)[1];
      if (middlewares.map(n => n.module).indexOf(moduleName) < 0) {
        msg.reply(` 不存在模块"${moduleName}"`, true);
      } else if (!getGlobalState('moduleManager', moduleName, true)) {
        msg.reply(` 模块"${moduleName}"已经处于禁用状态`, true);
      } else {
        setGlobalState('moduleManager', moduleName, false);
        middlewares[middlewares.findIndex(n => n.module === moduleName)].enable = false;
        msg.reply(` 模块"${moduleName}"已禁用`, true);
      }
    }
    return true;
  }
  return false;
});
