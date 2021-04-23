import Mirai, { Message, check } from 'mirai-ts';

const qq = 1931838621;

const mirai = new Mirai({
  host: '127.0.0.1',
  port: 9233,
  authKey: '114514aaaaaaaa',
  enableWebsocket: true,
});

(async () => {
  await mirai.link(qq);
  mirai.on('message', msg => {
    console.log(msg.plain);
    if (msg.type === 'GroupMessage') {
      if (msg.plain === 'test') {
        console.log('test')
        msg.reply('test', true);
      }
    }
  });
  mirai.listen();
})();

import '../goodMorning';
import '../imageLibrary';
import '../judgement';
import '../messageKeeper';
import '../messageLibrary';
import '../phonograph';
import '../repeater';
import '../ticketCollector';
import '../twitterMonitor';
