import { Schema, model } from 'mongoose';
import { registerMiddleware, log } from './index';

// 幸运值缓存
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
