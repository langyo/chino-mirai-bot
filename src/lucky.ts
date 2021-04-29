import { Schema, model } from 'mongoose';
import { registerMiddleware } from './index';

const LuckyRankModel = model('luckyRank', new Schema({
  id: { type: Number, index: true },
  date: Date,       // 这里的日期只会精确到天，时分秒部分会设置为零
  value: Number
}));

registerMiddleware('今日人品', async (msg, _api, _dbObj) => {
  if (msg.plain.trim() === '今日人品') {
    const now = new Date();
    if (!await LuckyRankModel.findOne({
      id: msg.sender.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }).exec()) {
      await (new LuckyRankModel({
        id: msg.sender.id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        value: Math.floor(Math.random() * 100)
      })).save();
    }
    const val = (await LuckyRankModel.findOne({
      id: msg.sender.id,
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }).exec() as any)?.value;
    const rawHead = ` 嗨~您今天的人品值是 ${val}~`;
    if (val <= 30) {
      msg.reply(rawHead + '好像运气不太好呢~', true);
    } else if (val <= 60) {
      msg.reply(rawHead + '看起来运气还可以~', true);
    } else {
      msg.reply(rawHead + '人气爆表了耶，快去抽卡吧~', true);
    }
    return true;
  }
  return false;
});

const LuckySelectWordModel = model('luckySelectWord', new Schema({
  name: String
}));
let luckySelectWordCache: string[];
(async () => {
  luckySelectWordCache = (await LuckySelectWordModel.find({}).exec()).map((n: any) => n.name);
})();

const commandRegExp = /^抓兔子姬( ([+-]) (.+))?$/;

registerMiddleware('抓兔子姬', async (msg, _api, _dbObj) => {
  const match = commandRegExp.exec(msg.plain.trim());
  if (match) {
    if (match[2]) {
      if (match[2] === '+') {
        // 添加词汇
        if (match[3].length > 30) {
          msg.reply(' 物品名称太长了啦！', true);
        } else if (await (LuckySelectWordModel.findOne({ name: match[3] }).exec())) {
          msg.reply(' 已经有这个物品啦！', true);
        } else {
          luckySelectWordCache.push(match[3]);
          await (new LuckySelectWordModel({ name: match[3] })).save();
          msg.reply(` 物品"${match[3]}"添加成功~`, true);
        }
      } else {
        // 删除词汇
        if (await (LuckySelectWordModel.findOne({ name: match[3] }).exec())) {
          luckySelectWordCache = luckySelectWordCache.filter(n => n !== match[3]);
          await (await (LuckySelectWordModel.findOne({ name: match[3] }).exec())).remove();
          msg.reply(` 物品"${match[3]}"删除成功~`, true);
        } else {
          msg.reply(' 物品不存在呐！', true);
        }
      }
    } else {
      msg.reply(` 呐呐，抽到了 ${luckySelectWordCache[
        Math.round(Math.random() * luckySelectWordCache.length)
      ]} 哦~`, true);
    }
    return true;
  }
  return false;
});
