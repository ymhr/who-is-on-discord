require('dotenv').config();
const http = require('http');
const Discord = require('discord.js');
const TelegramBot = require('node-telegram-bot-api');
const telegram = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: true});

const discord = new Discord.Client();
const channelId = Math.sign(process.env.TELEGRAM_CHANNEL_ID) === 1 ? -process.env.TELEGRAM_CHANNEL_ID : process.env.TELEGRAM_CHANNEL_ID;

let throttle = null;

const queue = {
    join: new Set(),
    leave: new Set()
};

const onVoiceStateUpdate = (oldMember, newMember) => {
    const newUserChannel = newMember.voiceChannel;
    const oldUserChannel = oldMember.voiceChannel;
    const userName = newMember.user.username;

    if(typeof oldUserChannel === 'undefined' && typeof newUserChannel !== 'undefined') {
        console.log(`user ${userName} joined`);
        queue.join.add(userName);
        clearTimeout(throttle);
        throttle = setTimeout(sendBatchMessage, 30000);
    } else if (typeof newUserChannel === 'undefined') {
        console.log(`user ${userName} left`);
        queue.leave.add(userName);
        clearTimeout(throttle);
        throttle = setTimeout(sendBatchMessage, 30000);
    }
};

telegram.onText(/#spoiler/, (msg) => {
    const chatId = msg.chat.id;
    telegram.sendPhoto(chatId, 'https://imgflip.com/i/2dywxh');
});

telegram.onText(/#downwithjames/, msg => {
    const chatId = msg.chat.id;
    telegram.sendPhoto(chatId, 'https://imgflip.com/i/2dyxar');
})

const sendBatchMessage = () => {
    const join = Array.from(queue.join);
    const leave = Array.from(queue.leave);
    const joinMessage = join.length ? `${join.join(', ')} ${join.length === 1 ? 'has' : 'have'} joined` : '';
    const leaveMessage = leave.length ? `${leave.join(', ')} ${leave.length === 1 ? 'has' : 'have'} left` : '';
    const message = [joinMessage, leaveMessage].join(joinMessage.length && leaveMessage.length ? '; ' : '');
    queue.join.clear();
    queue.leave.clear();
    telegram.sendMessage(channelId, message)
};

discord.on('voiceStateUpdate', onVoiceStateUpdate);
discord.login(process.env.DISCORD_TOKEN);

if (process.env.NODE_ENV === 'production') {
    http.createServer((req, res) => {
		res.end('Nothing to see here')
	}).listen(process.env.PORT || 80);
}

module.exports = {
    queue,
    onVoiceStateUpdate,
    sendBatchMessage
};
