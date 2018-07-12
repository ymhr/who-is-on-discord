require('dotenv').config();

const Discord = require('discord.js');
const discord = new Discord.Client();

const TelegramBot = require('node-telegram-bot-api');
const telegram = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: true});

const channelId = process.env.TELEGRAM_CHANNEL_ID;

const throttle = null;

discord.on('voiceStateUpdate', (oldMember, newMember) => {
    const newUserChannel = newMember.voiceChannel;
    const oldUserChannel = oldMember.voiceChannel;
    const userName = newMember.user.username;

    if(typeof oldUserChannel === 'undefined' && typeof newUserChannel !== 'undefined') {
        console.log('joined', newMember.user.username);
        telegram.sendMessage(channelId, `${userName} is on discord`);
    } else if (typeof newUserChannel === 'undefined') {
        telegram.sendMessage(channelId, `${userName} left discord`);
    }
});

discord.login(process.env.DISCORD_TOKEN);