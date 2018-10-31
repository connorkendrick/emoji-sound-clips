const Discord = require('discord.js');
const { createLogger, format, transports} = require('winston');
const auth = require('./auth.json');
const client = new Discord.Client();

// Configure logger settings
const logger = createLogger({
  level: 'debug',
  format: format.combine(format.colorize(), format.timestamp(), format.simple()),
  transports: [new transports.Console()]
});

// Log timestamp when client connects to a guild
client.on('ready', () => {
  logger.info('Connected');
  logger.info(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  // Use to differentiate emoji mappings for different servers
  let guildId = msg.guild.id;

  // Bot listens for messages that start with `!` for commands
  if (msg.content.substring(0, 1) === '!') {
    let args = msg.content.substring(1).split(' ');
    var cmd = args[0];

    switch (cmd) {
      // Create new mapping of emoji and sound clip for server
      case 'otoadd':
        msg.channel.send('Command to map a sound to an emoji');
        break;
      // Remove mapping of emoji and sound clip for server
      case 'otoremove':
        msg.channel.send('Command to remove a mapped emoji from the map')
        break;
      // List all current mappings for server
      case 'otolist':
        msg.channel.send('Command to list every key and value in map')
        break;
      // Force bot to disconnect from voice channel
      case 'otodisconnect':
        msg.channel.send('Command to make bot leave voice channel manually');
        break;
    }
  }

  // Iterate through list of keys for server in database
  // If match found, play sound clip
});

client.login(auth.token);
