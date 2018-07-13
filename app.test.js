
const Discord = require('discord.js')

const mockDiscordLogin = jest.fn();
const mockDiscordOn = jest.fn();
jest.mock('discord.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        login: mockDiscordLogin,
        on: mockDiscordOn,
        emit: () => this.on()
      }
    })
  };
});

const DISCORD_TOKEN = 'helpiamtrappedinthiscomputer';

const runApp = () => require('./app.js');

describe('discord voice channel listener', () => {
  const { queue } = require('./app.js');
  const DEFAULT_ENV = Object.assign({}, process.env);
  const mockUser = {
    username: 'Pusheen'
  };
  const mockHasChannel = {
    user: mockUser,
    voiceChannel: '#pusheens-parlour'
  };
  const mockNoChannel = {
    user: mockUser
  };

  beforeEach(() => {
    process.env.DISCORD_TOKEN = DISCORD_TOKEN;
  });

  afterEach(() => {
    process.env = DEFAULT_ENV;

    // Currently this module is a) stateful and b) runs on import,
    // so some fiddling with the queue is required in tests.
    queue.join.clear();
    queue.leave.clear();
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

  describe.only('onVoiceStateUpdate', () => {
    test('adds user to "join" queue when they join any voice channel', () => {
      const { onVoiceStateUpdate, queue } = runApp();
      onVoiceStateUpdate(mockNoChannel, mockHasChannel);

      expectQueueSize(queue.join, 1);
      expectQueueUser(queue.join, mockUser);

      expectQueueEmpty(queue.leave);
    });

    test('adds user to "leave" queue when they are no longer in a voice channel', () => {
      const { onVoiceStateUpdate, queue } = runApp();
      onVoiceStateUpdate(mockHasChannel, mockNoChannel);

      expectQueueSize(queue.leave, 1);
      expectQueueUser(queue.leave, mockUser);

      expectQueueEmpty(queue.join);
    });
  });

});

// Helpers

function expectQueueSize (queue, size) {
  expect(queue.size).toBe(size);
}

function expectQueueEmpty(queue) {
  expect(queue.size).toBe(0);
}

function expectQueueUser(queue, user) {
  expect(queue.has(user.username)).toBe(true);
}