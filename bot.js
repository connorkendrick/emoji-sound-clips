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

// Send intro message on guild join
client.on('guildCreate', guild => {
  console.log('Hello, I\'m Oto! Type !otohelp or @ me for a list of commands!');
});

client.on('message', msg => {
  // Don't read messages from bots
  if (msg.author.bot) {
    return;
  }

  // Help message sent when requested
  const helpMessage = 'Hello! I\'m Oto, a bot to map sound clips to emojis!\n\n' +
                      'Here\'s a list of commands you can give me:\n' +
                      '`!otoadd`: map sound clip to emoji\n' +
                      '`!otoremove`: remove mapping of sound clip to emoji\n' +
                      '`!otolist`: list all emoji to sound clip mappings\n' +
                      '`!otodisconnect`: manually remove me from a voice channel' +
                      '`!otohelp`: list available commands';

  // Bot should react differently when being messaged in a guild vs. in a DM
  if (msg.guild) {
    // Voice channel of user who sent message
    const voiceChannel = msg.member.voiceChannel;
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
        case 'otohelp':
          msg.channel.send(helpMessage);
          break;
      }
    }

    // Send help message when bot it mentioned
    if (msg.isMentioned(client.user)) {
      msg.channel.send(helpMessage);
    }

    // TODO: Iterate through list of keys for server in database. If match found, play sound clip
    if (msg.content === 'emoji' && voiceChannel) {
      voiceChannel.join();
      setTimeout(() => {
        voiceChannel.leave();
      }, 5000);
    }
  } else {
    if (msg.content === '!otohelp') {
      // Display introduction and list of available commands
      // TODO: Update commands to include parameters
      msg.channel.send('Hello! I\'m Oto, a bot to map sound clips to emojis!\n\n' +
                        'Here\'s a list of commands you can give me:\n' +
                        '`!otoadd`: map sound clip to emoji\n' +
                        '`!otoremove`: remove mapping of sound clip to emoji\n' +
                        '`!otolist`: list all emoji to sound clip mappings\n' +
                        '`!otodisconnect`: manually remove me from a voice channel');
    } else {
      msg.channel.send('Type `!otohelp` for a list of commands!');
    }
  }
});

client.login(auth.token);
