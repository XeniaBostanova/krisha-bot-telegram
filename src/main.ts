import { conf } from '../config.js';
import { Scenes, Telegraf } from 'telegraf';
import db, { Ad, User } from './helpers/database.js'
import { pause } from './helpers/utils.js'
import logger from './helpers/logger.js'
import { Logger } from 'log4js';
import { commands } from './helpers/const.js'

const bot = new Telegraf<Scenes.SceneContext>(conf.botToken);

bot.help((ctx) => ctx.reply(commands));


(async (): Promise<void> => {
  const _logger: Logger = logger.get('Main')
  await pause(1000);

  let users = await db.getUsers();
  let usersIds = users ? Object.keys(users) : [];

  bot.on('text', async (ctx) => {
    const {from} = ctx.update.message;
    const text = ctx.message.text;

    if (text === '/start') {
      _logger.info(`Мне написал пользователь ${from.id} ${from.username}`);
      await db.setUserListener(from as unknown as User);
      _logger.info(`Добавил пользователя ${from.id} ${from.username} в рассылку`);
      users = await db.getUsers();
      usersIds = users ? Object.keys(users) : [];
      _logger.info('Обновил список юзеров для рассылки');
      return ctx.reply(`Приветствую, ${from.username}! Я буду присылать варианты хаток для вас!`);
    }

    if (text === '/info') {
      return ctx.reply(`Параметры поиска: 1-2 комнатные квартиры в ЖК Абай 130 и Оркендеу площадью от 45 м2 и стоимостью до 45 млн тенге`);
    }

    if (text === '/adsdb') {
      const ads = await db.getAdsDb(); // fetch the ads from the database
      if (!ads || !ads.length) return ctx.reply("Объявлений в базе нет");
      let reply = "На данный момент в базе следующие объявления: \n";
      ads.forEach((ad, index) => reply += `${index + 1}. https://krisha.kz/a/show/${ad}\n`);
      return ctx.reply(reply);
    }
    return ctx.reply(`⬇ Выбери команду из списка или просто жди оповещений о новых объявлениях 🙂`);
  })

  function notifyUser(data: Ad): void {
    _logger.info('Произошло обновление списка объявлений');
    const text = `Появилось новое объявление: ${data.title}, цена ${data.price}, ЖК: ${data.address}!
Ссылка: https://krisha.kz${data.url}`;

    for (const id of usersIds) {
      bot.telegram.sendMessage(id, text);
      _logger.info(`Выслал оповещение пользователю ${id}`);
    }
  }

  db.updateAds(notifyUser);

  bot.launch();
})()


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
