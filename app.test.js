
const Discord = require('discord.js')

const mockDiscordLogin = jest.fn();
const mockDiscordOn = jest.fn();
jest.mock('discord.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        login: mockDiscordLogin,
        on: mockDiscordOn
      }
    })
  };
});

const DISCORD_TOKEN = 'helpiamtrappedinthiscomputer';

const runApp = () => require('./app.js');

describe('discord voice channel listener', () => {
  const DEFAULT_ENV = Object.assign({}, process.env);

  beforeEach(() => {
    process.env.DISCORD_TOKEN = DISCORD_TOKEN;
  });

  afterEach(() => {
    process.env = DEFAULT_ENV;
  });

  test('constructs a client and logs in with env token', () => {
    runApp();

    expect(Discord.Client).toHaveBeenCalledTimes(1);
    expect(mockDiscordLogin).toHaveBeenCalledTimes(1);
    expect(mockDiscordLogin).toHaveBeenCalledWith(DISCORD_TOKEN);
  });

  test('listens to "voiceStateUpdate" event to watch voice channels', () => {
    runApp();
    const [eventArg, callbackArg] = mockDiscordOn.mock.calls[0];
    
    expect(mockDiscordLogin).toHaveBeenCalledTimes(1);
    expect(mockDiscordOn).toHaveBeenCalledTimes(1);
    expect(eventArg).toBe('voiceStateUpdate')
    expect(typeof callbackArg).toBe('function')
  });

});