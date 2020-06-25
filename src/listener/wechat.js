import { Message, ScanStatus /* , log as wechatyLog */ } from 'wechaty';

import { global } from '../utils/global';
import * as cache from '../utils/cache';

// const dev = process.env.DEV ? true : false;

const dong = (data) => {
  // (data?: string)
  global.requestor.id().then((id) => {
    global.requestor.log({
      instance: global.setting.wechaty.name,
      id,
      level: 'info',
      type: 'wechat-worker.listener.wechat.dong',
      timestamp: Date.now(),
      // content: null,
    });
  });
};

const error = (error) => {
  // (error: Error)
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.error',
      timestamp: Date.now(),
      content: {
        name: error.name, // string
        message: error.message, // string
      },
    });
  });
};

/*
const friendship = (friendship) => {
  // (friendship: Friendship)
};
*/

const heatbeat = (data) => {
  // (data: any)
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.heatbeat',
      timestamp: Date.now(),
      // content: null,
    });
  });
};

const login = (user) => {
  // (user: ContactSelf)
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.login',
      timestamp: Date.now(),
      content: {
        name: user.name(), // string
      },
    });
  });
};

const logout = (user, reason) => {
  // (user: ContactSelf, reason?: string)
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.logout',
      timestamp: Date.now(),
      content: {
        name: user.name(), // string
        reason, // string
      },
    });
  });
};

const message = (m) => {
  // (m: Message)
  if (m.self()) {
    // ingore sent message
    return;
  }
  const one = m.from();
  const group = m.room();
  // id
  global.requestor.id().then((id) => {
    const promiseList = [
      one.alias(), // [0]
      group ? group.alias(one).catch(() => {
        // conceal a bug
        // https://github.com/wechaty/wechaty-puppet-puppeteer/issues/122
      }) : Promise.resolve(undefined), // [1]
      group ? group.topic() : Promise.resolve(undefined), // [2]
      Promise.resolve(undefined), // getFileBase64(m), // [3]
    ];
    Promise.all(promiseList).then((resultList) => {
      // log
      global.requestor.log({
        id,
        instance: global.setting.wechaty.name,
        level: 'info',
        category: 'wechat-worker.listener.wechat.message',
        timestamp: Date.now(),
        content: {
          messageType: Message.Type[m.type()], // string
          messageText: m.type() === Message.Type.Text ? m.text() : '', // string
          messageFileBase64: '', // resultList[3] ? (dev ? '[base64-encoded]' : resultList[3].base64) : '', // string
          messageFileName: '', // resultList[3] ? resultList[3].name : '', // string
          messageTimestamp: m.date().valueOf(), // number as long
          messageAgeMillisecond: m.age() * 1000, // number as long
          oneId: one.id, // string
          oneName: one.name(), // string
          oneAlias: typeof resultList[0] === 'string' ? resultList[0] : '', // string
          oneAliasInGroup: typeof resultList[1] === 'string' ? resultList[1] : '', // string
          oneIsFriend: one.friend() ? true : false, // boolean
          groupId: group ? group.id : '', // string
          groupName: typeof resultList[2] === 'string' ? resultList[2] : '', // string
        },
      });
    });
    // cache
    cache.set(id, { message: m, one, group });
  });
};

/*
const getFileBase64 = async (message) => {
  // There is a bug which may terminate the whole process.
  // https://github.com/wechaty/wechaty-puppet-puppeteer/issues/124
  try {
    if (message.type() === Message.Type.Text) {
      return undefined;
    } else {
      const file = await message.toFileBox();
      if (file) {
        return {
          base64: await file.toBase64(),
          name: file.name,
        };
      }
      return undefined;
    }
  } catch (e) {
    wechatyLog.error('local.listener.wechat.message.file', JSON.stringify(error));
    console.log();
    return undefined;
  }
};
*/

const ready = () => {
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.ready',
      timestamp: Date.now(),
      // content: null,
    });
  });
};

/*
const roomInvite = (roomInvitation) => {
  // (roomInvitation: RoomInvitation)
  // TODO: bug - event connot be emitted.
};

const roomJoin = (room, inviteeList, inviter, date) => {
  // (room: Room, inviteeList: Contact[], inviter: Contact, date?: Date)
};

const roomLeave = (room, leaverList) => {
  // (room: Room, leaverList: Contact[],  remover?: Contact, date?: Date)
};

const roomTopic = (room, newTopic, oldTopic, changer, date) => {
  // (room: Room, newTopic: string, oldTopic: string, changer: Contact, date?: Date)
};
*/

const scan = (qrcode, status) => {
  // (qrcode: string, status: ScanStatus, data?: string)
  global.loginApproach.status = ScanStatus[status];
  global.loginApproach.url = qrcode;
  global.loginApproach.qrcode = [
    'https://api.qrserver.com/v1/create-qr-code/?data=',
    encodeURIComponent(qrcode),
  ].join('');
  global.loginApproach.timestamp = Date.now();
  //
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.scan',
      timestamp: Date.now(),
      content: {
        status: global.loginApproach.status, // string
        url: global.loginApproach.url, // string
        qrcode: global.loginApproach.qrcode, // string
        timestamp: global.loginApproach.timestamp, // number as long
      },
    });
  });
};

const start = () => {
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.start',
      timestamp: Date.now(),
      // content: null,
    });
  });
};

const stop = () => {
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.listener.wechat.stop',
      timestamp: Date.now(),
      // content: null,
    });
  });
};

const listen = () => {
  // event
  global.robot.on('dong', dong);
  global.robot.on('error', error);
  // global.robot.on('friendship', friendship);
  global.robot.on('heatbeat', heatbeat);
  global.robot.on('login', login);
  global.robot.on('logout', logout);
  global.robot.on('message', message);
  global.robot.on('ready', ready);
  // global.robot.on('room-invite', roomInvite);
  // global.robot.on('room-join', roomJoin);
  // global.robot.on('room-leave', roomLeave);
  // global.robot.on('room-topic', roomTopic);
  global.robot.on('scan', scan);
  global.robot.on('start', start);
  global.robot.on('stop', stop);
};

export { listen };
