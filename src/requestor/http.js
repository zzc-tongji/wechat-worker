import fetch, { Headers } from 'node-fetch';
import { log as wechatyLog } from 'wechaty';

import { global } from '../utils/global';
import { getId as terminalGetId } from './terminal';

let bodyToken;
let headerPost;
let idUrl;
let logUrl;

const init = () => {
  headerPost = new Headers({ 'Content-Type': 'application/json; charset=UTF-8' });
  const baseUrl = global.setting.http.sender.url.replace(/\/+$/, '');
  idUrl = baseUrl + '/id';
  logUrl = baseUrl + '/log';
  bodyToken = JSON.stringify({ token: global.setting.http.sender.token });
};

const log = (content) => {
  // (content: object)
  return new Promise((resolve) => {
    const contentCopy = JSON.parse(JSON.stringify(content));
    contentCopy.token = global.setting.http.sender.token;
    fetch(logUrl, { method: 'POST', headerPost, body: JSON.stringify(contentCopy) }).then((response) => {
      if (!response.ok) {
        throw `fetch ${logUrl} => ${response.status}`;
      }
      resolve();
    }).catch((error) => {
      // local log
      wechatyLog.warn('local.requestor.http.log', error);
      console.log();
      resolve();
    });
  });
};

const getId = () => {
  return new Promise((resolve) => {
    fetch(idUrl, { method: 'POST', headerPost, body: bodyToken }).then((response) => {
      if (!response.ok) {
        throw `fetch ${idUrl} => ${response.status}`;
      }
      response.json().then((data) => {
        if (!data.id) {
          throw `fetch ${idUrl} => id not found`;
        }
        resolve(data.id);
      });
    }).catch((error) => {
      // local log
      wechatyLog.warn('local.requestor.http.get-id', error);
      console.log();
      terminalGetId().then((id) => {
        resolve(id);
      });
    });
  });
};

export { init, log, getId };
