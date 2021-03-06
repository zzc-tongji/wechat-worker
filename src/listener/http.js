import * as fs from 'fs';
import { sep } from 'path';

import express from 'express';
import { log as localLog } from 'wechaty';

import * as wechat from '../requestor/wechat';
import { global } from '../utils/global';
import { getStatus } from '../utils/status';
import { errorhandler } from './http-utils/error-handler';
import * as forward from './http-utils/validator/forward';
import * as reply from './http-utils/validator/reply';
import * as send from './http-utils/validator/send';
import * as token from './http-utils/validator/token';

const app = express();

const html = fs.readFileSync(`${__dirname}${sep}..${sep}..${sep}static${sep}wechat-connector.html`, { encoding: 'utf-8', flag: 'r' });

// Get - /
app.get('/', (_req, res) => {
  // response
  res.set('Content-Type', 'text/html;charset=utf-8')
      .set('Cache-Control', 'no-store,no-cache,must-revalidate,proxy-revalidate')
      .set('Pragma', 'no-cache')
      .set('Expires', 'no-store')
      .set('Surrogate-Control', 'no-store')
      .send(html.replace('${instance}', global.setting.wechaty.name).replace('${status}', getStatus()));
});

// POST /rpc/exit
app.post('/rpc/exit', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  global.stop().then(() => {
    // local log
    localLog.info('local.normal.end', '\n=> 0');
    console.log();
    // response
    res.status(204);
    res.send();
    // exit
    process.exit(0);
  });
});

// POST => /rpc/forward
app.post('/rpc/forward', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(forward.validate, req, res);
  if (!data) {
    return;
  }
  // forward
  data.rpcToken = '<validated>';
  wechat.forward(data);
  // response
  res.status(202);
  res.send();
});

// POST => /rpc/log
app.post('/rpc/log', express.text({ type: 'application/json' }), (req, res) => {
  // echo as local log
  localLog.info('local.echo', typeof req.body == 'string' ? `\n=> ${req.body}` : '');
  console.log();
  // response
  res.status(202);
  res.send();
});

// POST => /rpc/login-approach
app.post('/rpc/login-approach', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  // response
  res.set('content-type', 'application/json;charset=UTF-8');
  res.send(JSON.stringify({ loginApproach: global.loginApproach }));
});

// POST /rpc/status
app.post('/rpc/status', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  // response
  res.set('content-type', 'application/json;charset=UTF-8');
  res.send(JSON.stringify({
    instance: global.setting.wechaty.name,
    category: 'wechat-connector',
    status: getStatus(),
  }));
});

// POST => /rpc/logout
app.post('/rpc/logout', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  // logout
  global.logout();
  // response
  res.status(202);
  res.send();
});

// POST => /rpc/logout/await
app.post('/rpc/logout/await', express.text({ type: 'application/json' }), async (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  // logout
  await global.logout();
  // response
  res.status(204);
  res.send();
});

// POST => /rpc/reply
app.post('/rpc/reply', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(reply.validate, req, res);
  if (!data) {
    return;
  }
  // reply
  data.rpcToken = '<validated>';
  wechat.reply(data);
  // response
  res.status(202);
  res.send();
});

// POST => /rpc/send
app.post('/rpc/send', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(send.validate, req, res);
  if (!data) {
    return;
  }
  // send
  data.rpcToken = '<validated>';
  wechat.send(data);
  // response
  res.status(202);
  res.send();
});

// POST => /rpc/sync
app.post('/rpc/sync', express.text({ type: 'application/json' }), (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  // sync
  wechat.syncAll();
  // response
  res.status(202);
  res.send();
});

// POST => /rpc/sync/await
app.post('/rpc/sync/await', express.text({ type: 'application/json' }), async (req, res) => {
  // request
  const data = errorhandler(token.validate, req, res);
  if (!data) {
    return;
  }
  // sync
  await wechat.syncAll();
  // response
  res.status(204);
  res.send();
});

const listen = () => {
  app.listen(global.setting.http.receiver.port);
};

export { listen };
