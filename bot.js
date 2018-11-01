const Discord = require('discord.js');
const { createLogger, format, transports} = require('winston');
const auth = require('./auth.json');
const client = new Discord.Client();
const SQLite = require('better-sqlite3');
const sql = new SQLite('./mappings.sqlite');

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

  // Check if table "map" exists
  const table = sql.prepare('SELECT count(*) FROM sqlite_master WHERE type=\'table\' AND name=\'maps\';').get();
  if (!table['count(*)']) {
    // If the table isn't there, create it and setup the database correctly
    // id is the concatenation of the guildId and the emoji (so unique id can exist)
    sql.prepare('CREATE TABLE maps (id TEXT PRIMARY KEY, guildId TEXT, emoji TEXT, url TEXT, startTime TEXT, endTime TEXT);').run();
    sql.pragma('synchronous=1');
    sql.pragma('journal_mode=wal');
  }

  // Two prepared statements to get and set data
  client.getGuildMaps = sql.prepare('SELECT * FROM maps WHERE guildId=?');
  client.getMap = sql.prepare('SELECT * FROM maps WHERE id=?');
  client.addMap = sql.prepare('INSERT OR REPLACE INTO maps (id, guildId, emoji, url, startTime, endTime) VALUES (@id, @guildId, @emoji, @url, @startTime, @endTime);');
  client.removeMap = sql.prepare('DELETE FROM maps WHERE id=?');
});

// Send intro message on guild join
client.on('guildCreate', guild => {
  console.log('Hello, I\'m Oto! Type !otohelp or @ me for a list of commands!');
});

// Help message sent when requested
const helpMessage = 'Hello! I\'m Oto, a bot to map sound clips to emojis!\n\n' +
'Here\'s a list of commands you can give me:\n' +
'`!otoadd [emoji] [YouTube URL] [startTime (optional)] [endTime (optional)]`: map sound clip to emoji\n' +
'`!otoremove [emoji]`: remove mapping of sound clip to emoji\n' +
'`!otolist`: list all emoji to sound clip mappings\n' +
'`!otodisconnect`: manually remove me from a voice channel' +
'`!otohelp`: list available commands';

client.on('message', msg => {
  // Don't read messages from bots
  if (msg.author.bot) {
    return;
  }

  // Bot should react differently when being messaged in a guild vs. in a DM
  if (msg.guild) {
    // Use to differentiate emoji mappings for different servers
    const guildId = msg.guild.id;
    // Specific emoji to sound clip mapping
    // TODO cache in local memory so it doesn't have to query the database every msg?
    const map = client.getMap.get(guildId + msg.content);
    // Voice channel of user who sent message
    const voiceChannel = msg.member.voiceChannel;

    // Bot listens for messages that start with `!` for commands
    if (msg.content.substring(0, 1) === '!') {
      const args = msg.content.substring(1).split(' ');
      const cmd = args[0];

      switch (cmd) {
        // Create new mapping of emoji and sound clip for server
        case 'otoadd':
          if (args.length <= 5 && args.length >= 3) {
            m = {
              id: guildId + args[1],
              guildId: guildId,
              emoji: args[1],
              url: args[2],
              startTime: '',
              endTime: ''
            }

            if (args.length === 5) {
              m.startTime = args[3];
              m.endTime = args[4];
            } else if (args.length === 4) {
              m.startTime = args[3];
            }

            client.addMap.run(m);
          }
          break;
        // Remove mapping of emoji and sound clip for server
        case 'otoremove':
          if (args.length === 2) {
            client.removeMap.run(args[1]);
          }
          break;
        // List all current mappings for server
        case 'otolist':
          const guildMaps = client.getGuildMaps.all(guildId);
          if (guildMaps) {
            let rowInfo = ''
            for (let i = 0; i < guildMaps.length; i++) {
              rowInfo += guildMaps[i].emoji + ': ' + guildMaps[i].url + '\t[' + guildMaps[i].startTime + ' - ' + guildMaps[i].endTime + ']\n';
            }
            msg.channel.send(rowInfo);
          }
          break;
        // Force bot to disconnect from voice channel
        case 'otodisconnect':
          if (voiceChannel) {
            voiceChannel.leave();
          }
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

    // Enter voice channel of user who sent valid mapped emoji
    if (map && voiceChannel && msg.content === map.emoji) {
      voiceChannel.join();
      setTimeout(() => {
        voiceChannel.leave();
      }, 5000);
    }
  } else {
    if (msg.content === '!otohelp') {
      msg.channel.send(helpMessage);
    } else {
      msg.channel.send('Type `!otohelp` for a list of commands!');
    }
  }
});

client.login(auth.token);
