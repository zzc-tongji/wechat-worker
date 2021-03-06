import * as cache from '../utils/cache';
import { global } from '../utils/global';
import { id, log } from './http';

import { Contact, Message, Room } from 'wechaty';

const logFailure = async (reason, contextType, payload) => {
  // (reason: string, callerType: string, payload: object)
  const content = JSON.stringify({
    reason, // string
    request: JSON.stringify(payload), // string
  });
  // log
  log({
    id: await id(),
    instance: global.setting.wechaty.name,
    level: 'WARN',
    category: `wechat-connector.${contextType}.error`,
    timestampMs: Date.now(),
    content,
  });
};

const checkRobot = async (contextType, payload) => {
  // (callerType: string, payload: object)
  if (!global.robot) {
    await logFailure('robot non-existent', contextType, payload);
    return false;
  }
  if (!global.robot.logonoff()) {
    await logFailure('robot logged-out', contextType, payload);
    return false;
  }
  return true;
};

const forward = async (payload) => {
  // (payload: object)
  const contextType = 'requestor.wechat.forward';
  if (!await checkRobot(contextType, payload)) {
    return;
  }
  const context = cache.get(payload.id);
  if (!context) {
    await logFailure('message expired', contextType, payload);
    return;
  }
  let recipient;
  if (payload.receiver.category === 'friend') {
    // to friend
    if (payload.receiver.isAlias) {
      recipient = await global.robot.Contact.find({ alias: payload.receiver.name });
    } else {
      recipient = await global.robot.Contact.find({ name: payload.receiver.name });
    }
    if (!recipient) {
      await logFailure('friend not found', contextType, payload);
      return;
    }
    try {
      // forward
      await context.message.forward(recipient);
    } catch (error) {
      await logFailure(error.message, contextType, payload);
      return;
    }
    // log
    log({
      id: await id(),
      instance: global.setting.wechaty.name,
      level: 'INFO',
      category: `wechat-connector.${contextType}`,
      timestampMs: Date.now(),
      content: JSON.stringify({
        messageId: context.message.id, // string
        messageType: Message.Type[context.message.type()], // string
        messageText: context.message.type() === Message.Type.Text ? context.message.text() : '', // string
        receiverId: recipient.id, // string
        receiverType: 'friend', // string
        receiverName: recipient.name(), // string
      }),
    });
  } else if (payload.receiver.category === 'group') {
    // to group
    recipient = await global.robot.Room.find({ topic: payload.receiver.name });
    if (!recipient) {
      await logFailure('group not found', contextType, payload);
      return;
    }
    try {
      // forward
      await context.message.forward(recipient);
    } catch (error) {
      await logFailure(error.message, contextType, payload);
      return;
    }
    // log
    log({
      id: await id(),
      instance: global.setting.wechaty.name,
      level: 'INFO',
      category: `wechat-connector.${contextType}`,
      timestampMs: Date.now(),
      content: JSON.stringify({
        messageId: context.message.id, // string
        messageType: Message.Type[context.message.type()], // string
        messageText: context.message.type() === Message.Type.Text ? context.message.text() : '', // string
        receiverId: recipient.id, // string
        receiverType: 'group', // string
        receiverName: await recipient.topic(), // string
      }),
    });
  }
};

const reply = async (payload) => {
  // (payload: object)
  const contextType = 'requestor.wechat.reply';
  if (!await checkRobot(contextType, payload)) {
    return;
  }
  const context = cache.get(payload.id);
  if (!context) {
    await logFailure('message expired', contextType, payload);
    return;
  }
  if (context.group) {
    // from one in group
    //
    try {
      // reply
      context.group.say(payload.message, context.one);
    } catch (error) {
      await logFailure(error.message, contextType, payload);
      return;
    }
    // log
    log({
      id: await id(),
      instance: global.setting.wechaty.name,
      level: 'INFO',
      category: `wechat-connector.${contextType}`,
      timestampMs: Date.now(),
      content: JSON.stringify({
        messageText: payload.message, // string
        receiverId: context.group.id, // string
        receiverType: 'group', // string
        receiverName: await context.group.topic(), // string
      }),
    });
  } else {
    // from friend
    //
    try {
      // reply
      context.one.say(payload.message);
    } catch (error) {
      await logFailure(error.message, contextType, payload);
      return;
    }
    // log
    log({
      id: await id(),
      instance: global.setting.wechaty.name,
      level: 'INFO',
      category: `wechat-connector.${contextType}`,
      timestampMs: Date.now(),
      content: JSON.stringify({
        messageText: payload.message, // string
        receiverId: context.one.id, // string
        receiverType: 'friend', // string
        receiverName: context.one.name(), // string
      }),
    });
  }
};

const send = async (payload) => {
  // (payload: object)
  const contextType = 'requestor.wechat.send';
  if (!await checkRobot(contextType, payload)) {
    return;
  }
  let recipient;
  if (payload.receiver.category === 'friend') {
    // to friend
    if (payload.receiver.isAlias) {
      recipient = await global.robot.Contact.find({ alias: payload.receiver.name });
    } else {
      recipient = await global.robot.Contact.find({ name: payload.receiver.name });
    }
    if (!recipient) {
      await logFailure('friend not found', contextType, payload);
      return;
    }
    try {
      // send
      await recipient.say(payload.message);
    } catch (error) {
      await logFailure(error.message, contextType, payload);
      return;
    }
    // log
    log({
      id: await id(),
      instance: global.setting.wechaty.name,
      level: 'INFO',
      category: `wechat-connector.${contextType}`,
      timestampMs: Date.now(),
      content: JSON.stringify({
        messageText: payload.message, // string
        receiverId: recipient.id, // string
        receiverType: 'friend', // string
        receiverName: recipient.name(), // string
      }),
    });
  } else if (payload.receiver.category === 'group') {
    // to group
    recipient = await global.robot.Room.find({ topic: payload.receiver.name });
    if (!recipient) {
      await logFailure('group not found', contextType, payload);
      return;
    }
    try {
      // send
      await recipient.say(payload.message);
    } catch (error) {
      await logFailure(error.message, contextType, payload);
      return;
    }
    // log
    log({
      id: await id(),
      instance: global.setting.wechaty.name,
      level: 'INFO',
      category: `wechat-connector.${contextType}`,
      timestampMs: Date.now(),
      content: JSON.stringify({
        messageText: payload.message, // string
        receiverId: recipient.id, // string
        receiverType: 'group', // string
        receiverName: await recipient.topic(), // string
      }),
    });
  }
};

const syncAll = async () => {
  if (!await checkRobot('sync', null)) {
    return;
  }
  const promiseList = [];
  await Promise.all([
    global.robot.Contact.findAll().then((resultList) => {
      resultList.forEach((contact) => {
        promiseList.push(sync(contact));
      });
    }),
    global.robot.Room.findAll().then((resultList) => {
      resultList.forEach((room) => {
        promiseList.push(sync(room));
      });
    }),
  ]);
  await Promise.all(promiseList);
  await log({
    id: await id(),
    instance: global.setting.wechaty.name,
    level: 'INFO',
    category: 'wechat-connector.requestor.wechat.sync-all',
    timestampMs: Date.now(),
    content: '{}',
  });
};

const sync = async (obj) => {
  let payload;
  if (obj instanceof Contact) {
    payload = {
      objectType: 'friend',
      objectName: obj.name(),
    };
  } else if (obj instanceof Room) {
    payload = {
      objectType: 'group',
      objectName: await obj.topic(),
    };
  } else {
    // invalid type
    return;
  }
  await obj.sync();
  await log({
    id: await id(),
    instance: global.setting.wechaty.name,
    level: 'VERB',
    category: 'wechat-connector.requestor.wechat.sync',
    timestampMs: Date.now(),
    content: JSON.stringify(payload),
  });
};

export { forward, reply, send, syncAll, sync };
