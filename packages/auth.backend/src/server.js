import express from 'express';
import session from 'express-session';
import logger from '@~/log';
import expressWinston from 'express-winston';
import cors from 'cors';
import DynamoStore from 'dynamodb-store';
import authRoutes, { mountAuth } from './providers';
import Config from './config';

const server = express();

server.use(cors(Config.getCorsConfig()));

server.use(expressWinston.logger({
  winstonInstance: logger
}));

server.use(require('cookie-parser')());
server.use(require('body-parser').urlencoded({ extended: true }));

server.use(session({
  resave: false,
  saveUninitialized: false,
  ...(Config.dev ? {
    secret: 'keyboard cat',
    store: (() => {
      const { resolve } = require('path');
      const mkdirp = require('mkdirp');
      const PouchSession = require('session-pouchdb-store');
      const dataPath = resolve(__dirname, '../.data/session-storage');
      mkdirp.sync(dataPath);
      return new PouchSession(dataPath);
    })()
  } : {
    secret: Config.sessions.key,
    store: new DynamoStore({
      table: {
        name: Config.sessions.table,
        hashKey: 'sessionId',
        hashPrefix: 'session'
      },
      dynamoConfig: {
        region: Config.sessions.region,
        ...(Config.dev ? {
          accessKeyId: 'dummy value',
          secretAccessKey: 'dummy value',
          endpoint: Config.getEndpoint('dynamo')
        } : null)
      }
    }),
    cookie: {
      httpOnly: true,
      domain: `.${Config.getCookieDomain()}`
    }
  })
}));
mountAuth(server);

server.use('/auth', authRoutes);

export default server;
