import Hashmap from 'hashmap';

import { global } from './global';

let cache;
let expiration;
let timer;

const init = () => {
  cache = new Hashmap();
  expiration = global.setting.cache.expirationSecond * 1000;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  timer = setInterval(removeExpired, expiration);
};

const removeExpired = () => {
  const remove = [];
  cache.forEach((value, key) => {
    if (Date.now() - value.timestamp > expiration) {
      remove.push(key);
    }
  });
  remove.forEach((key) => {
    cache.delete(key);
  });
  if (!global.setting.cache.enableLog) {
    return;
  }
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.cache.remove-expired',
      timestamp: Date.now(),
      // content: null,
    });
  });
};

const get = (key) => {
  const value = cache.get(key);
  if (!global.setting.cache.enableLog) {
    return;
  }
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.cache.get',
      timestamp: Date.now(),
      content: {
        key, // number as long
        success: value ? true : false, // boolean
      },
    });
  });
  return value;
};

const set = (key, value) => {
  if (!value.timestamp) {
    value.timestamp = Date.now();
  }
  cache.set(key, value);
  if (!global.setting.cache.enableLog) {
    return;
  }
  global.requestor.id().then((id) => {
    global.requestor.log({
      id,
      instance: global.setting.wechaty.name,
      level: 'info',
      category: 'wechat-worker.cache.set',
      timestamp: Date.now(),
      content: {
        key, // number as long
      },
    });
  });
};

export { init, get, set };
