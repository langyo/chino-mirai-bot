# 香风智乃萌战应援群机器人

![入群二维码](https://i.niupic.com/images/2021/04/24/9gJS.png)

欢迎加入[香风智乃萌战应援群](https://jq.qq.com/?_wv=1027&k=JF73yG0b)！

## 启动

- 安装 Java 运行时（版本必须 >= 11）
- 从 [Releases](https://github.com/iTXTech/mirai-console-loader/releases) 下载最新版本的`MCL`，解压到此文件夹
- 安装 Node.js
- 运行 ```npm i``` 或 ```yarn```（如果已经安装了 yarn）
- 先在此文件夹运行 ```npm run start:server```，再在新的终端下切换到此文件夹，运行 ```npm run start:client```

## 模块规划

### moduleManager
- [x] 输入```@姬姬 提示```可以回复所有已有指令的用法文档链接
- [x] 可以通过指令```@姬姬 状态 <模块名>```查看某模块的统计信息与是否开关；通过指令```@姬姬 打开模块 <模块名>```与```@姬姬 关闭模块 <模块名>```对模块进行开关操作（在额外权限控制上线之前，暂不对执行者作出限制）

### greeting
- [x] 早 5 点至 8 点之间的群友签到功能，要求匹配到“早”、“早安”、“早上好”时会自动进行响应，并说出今天是第几个喊早的（相当于签到功能；仅记录前 30 名，30 名之后的只会回复“早”而不会报告排名）
- [x] 在其它时间，如果触发此模块，在一小时之内只会回复一次不在早上时间的提示
- [ ] 如果有群员不在中国内陆，可以通过指令```时区设置 <国家/地区名>```进行定制化调整；以这种方式调整时区的群员在问候早安时不会计入排名
- [ ] 输入```早起排行```可以输出一份前 10 名早起人的名单排行；仅在当天 8 点以后可以执行，并且 1 分钟内只能被执行一次
- [x] 每天早上每个人只会响应一次早安，多于二次的早安都将无视
- [x] 晚 8 点至次日 5 点之间的群友签到功能，要求匹配到“晚安”时会自动进行响应
- [ ] 如果有群员不在中国内陆，可以通过指令```时区设置 <国家/地区名>```进行定制化调整
- [x] 在其它时间，如果触发此模块，在一小时之内只会回复一次不在晚上时间的提示
- [x] 每天晚上每个人只会响应一次晚安，多于一次的晚安都将会引起吐槽

### repeater
- [x] 当有两个或两个以上群友重复同一句话时，自动触发复读（同一段文字的复读在三分钟之内只会触发一次）

### imageLibrary
- [ ] 输入```来点兔子```后，机器人会自动从库中发送一张智乃图片；输入```储存图片```后再发送一张图片后，机器人会自动将图片保存入库（图片采用 SHA3 上指纹，保证图片不重复；当保存重复图片时，机器人会进行提醒；图片直接储存进文件系统，不经过数据库）
- [ ] 自动尝试分析未入库的图片中是否有二维码，一旦有二维码被成功解析，立即将解析结果向群内发送
- [ ] 输入```图片追溯```后，机器人会等待指令发出者发送一张图片，自动上传到 SauceNao 尝试追溯其 Pixiv 链接，并将结果回复给此人
- [ ] 输入```图片追溯 <Pixiv图片ID|Pixiv图片URL>```，机器人会自动分析并将对应的 Pixiv 源图片发送至群内

### ticketCollector
- [ ] 萌战收票时段，机器人接受私聊，自动对提交的票根图片与文本数据进行储存，并回复感谢信息（待实验）

### judgement（~~夹击妹抖~~）
- [ ] 自动对违规文本进行检测（敏感词词库来源暂未定型），并进行撤回、禁言一分钟与私聊警告操作（可以通过回复机器人以解除对某个关键字的屏蔽；需要审核）
- [ ] 自动对违规图片进行检测（使用腾讯色图识别 SDK；所有进入图库的重复图片不进行识别，以节省配额），色情识别率超过 60% 时进行撤回、禁言一分钟与私聊警告操作（同样可以通过回复机器人以解除屏蔽）

### messageLibrary
- [x] 自动对群聊天内容进行记录与存档
- [x] 输入```留言 @某群友 内容```后，会自动在目标群友下一次说话时重新发送内容
- [x] 输入```长留言 @某群友```后，会自动开始录制接下来留言者所说的一切内容，直到留言者单独说```over```后停止录制，在目标群友说话时自动将所有留言内容发出来
- [ ] 当有撤回消息时，可以通过指令```反撤回 @某群友```，将此人最近的一批已被撤回的消息重新发送出来；反撤回不会只发送最近的一份消息，而是将最近一次撤回之前五分钟内时段的所有信息发送出来
- [ ] 当出现闪照时，可以通过指令```重发闪照 @某群友```，将此人最近的一批闪照重新发送出来，并于一分钟后撤回；闪照转发不会只发送最近的一份消息，而是将最近一次发送闪照之前五分钟内时段的所有信息发送出来
- [ ] 群聊天内容的历史查阅将在未来以群公开网站的形式与大家见面

### twitterMonitor
- [ ] 点兔官方 twitter 的自动推送，直接发送到群里（将使用本地代理进行访问，使用 twitter 公开 api，每一小时检查一次）（带日转中翻译，使用百度翻译 API，token 也用我自己的）

### phonograph
- [ ] 输入```点歌 <歌曲名>```，会自动尝试从音乐平台拉取音频，并以语音的形式发送到群里
- [ ] 计划支持网易云音乐、酷狗音乐和 QQ 音乐的音频源
- [ ] 过长的音频（>= 240s）会被裁切，末尾部分会渐变音量减小（需要接入 ffmpeg）

### permissionForwarding
- [ ] 用于应对管理员席位不足而有人需要临时使用管理员权限的情况，管理员可以通过```添加额外管理员 @某群友```与```移除额外管理员 @某群友```来控制群友的指令使用权限
- [ ] 具有额外管理员权限的群友可以使用```禁言 @某群友 <分钟>```进行临时禁言，使用```公告 <内容>```发布公告，使用```禁止响应指令 @某群友 <分钟>```临时的关闭此群友使用机器人的权限（一般用于反刷屏）

### gameQuery
- [ ] 针对原神的 UID 查询设施
- [ ] 针对 arcaea 的成绩查询设施
- [ ] 针对 osu! 的成绩查询设施

### welcome
- [ ] 当有新成员加入时，自动发送欢迎信息

### linkParser
- [ ] 当检测到 Bilibili 视频网址/xml标签时，自动对其尝试解析，并将视频标题、UP 主及活跃数据发送至群内
- [ ] 当检测到网易云音乐网址/xml标签时，自动对其尝试解析，并将音乐名、作者及音频本身发送至群内

### ~~happy~~Lucky~~SmileYEAH~~
- [x] 输入```今日人品```，将能获取抽签者当天的人品信息，为一个 0 ~ 100 之间的随机数
- [x] 输入```抓兔子姬```，将能随机从已有的物品列表中抽取一个物品发送出来；输入```抓兔子机 + <物品名称>```可以额外添加物品，输入```抓兔子姬 - <物品名称>```可以移除物品
