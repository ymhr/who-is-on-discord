const Discord = require('discord.js')

jest.useFakeTimers();

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
    mockDiscordLogin.mockReset();
    mockDiscordOn.mockReset();

    // reset module state (i.e. queue)
    jest.resetModules();
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

  describe('onVoiceStateUpdate', () => {
    beforeEach(() => {
      jest.clearAllTimers();
      setTimeout.mockClear();
      clearTimeout.mockClear();
    });

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

    test('sends a batch message about user activity after 30 seconds', () => {
      const { onVoiceStateUpdate, sendBatchMessage, messaging } = runApp();
      onVoiceStateUpdate(mockNoChannel, mockHasChannel);

      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledWith(messaging.sendBatchMessage, 30000);
    });

    test('resets the batch message delay when receiving continuous user activity', () => {
      const app = runApp();
      const { onVoiceStateUpdate, sendBatchMessage, messaging } = app;
      const sendBatchMessageSpy = jest
        .spyOn(messaging, 'sendBatchMessage')
        .mockImplementation(() => {});
      
      onVoiceStateUpdate(mockNoChannel, mockHasChannel);

      // First timer is set
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenCalledWith(sendBatchMessageSpy, 30000);
      // Let's say half the timer elapses
      jest.advanceTimersByTime(15000);

      // Some continuous activity
      onVoiceStateUpdate(mockHasChannel, mockNoChannel);
      onVoiceStateUpdate(mockNoChannel, mockHasChannel);

      // Two new timers set
      expect(setTimeout).toHaveBeenCalledTimes(3);
      expect(clearTimeout).toHaveBeenCalledTimes(3);
      expect(setTimeout).toHaveBeenNthCalledWith(2, sendBatchMessageSpy, 30000);
      expect(setTimeout).toHaveBeenNthCalledWith(3, sendBatchMessageSpy, 30000);

      // Only one timer, the final timer, will complete
      jest.runAllTimers();
      expect(sendBatchMessageSpy).toHaveBeenCalledTimes(1);
      sendBatchMessageSpy.mockRestore();
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