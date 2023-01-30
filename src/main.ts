import { conf } from '../config.js';
import { Scenes, Telegraf } from 'telegraf';
import db, { User } from './helpers/database.js'
import { pause } from './helpers/utils.js'
import logger from './helpers/logger.js'
import { Logger } from 'log4js';

const bot = new Telegraf<Scenes.SceneContext>(conf.botToken);


(async (): Promise<void> => {
  const _logger: Logger = logger.get('Main')
  await pause(1000);

  let users = await db.getUsers();
  let usersIds = users ? Object.keys(users) : [];

  bot.on('text', async (ctx) => {
    const {from} = ctx.update.message;
    await db.setUserListener(from as unknown as User);
    ctx.reply('Приветствую! Вы добавлены в рассылку');
    users = await db.getUsers();
    usersIds = users ? Object.keys(users) : [];
    console.log(usersIds);
    _logger.info('add user')
  })

  bot.launch();
})()


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
