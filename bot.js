const Discord = require('discord.js');
const { createLogger, format, transports} = require('winston');
const auth = require('./auth.json');
const client = new Discord.Client();

// Configure logger settings
const logger = createLogger({
  level: 'debug',
  format: format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()]
});

client.on('ready', () => {
  logger.info('Connected');
  logger.info(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // Bot listens for messages that start with `!`
  if (msg.content.substring(0, 1) === '!') {
    let args = msg.content.substring(1).split(' ');
    var cmd = args[0];

    args = args.splice(1);
    switch (cmd) {
      case 'ping':
        msg.reply('Pong!');
        break;
    }
  }
});

client.login(auth.token);
