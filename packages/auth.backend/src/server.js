import express from 'express';
import session from 'express-session';
import logger from '@~/log';
import expressWinston from 'express-winston';
import authRoutes, { mountAuth } from './providers';

const server = express();

server.use(expressWinston.logger({
  winstonInstance: logger
}));

server.use(require('cookie-parser')());
server.use(require('body-parser').urlencoded({ extended: true }));

server.use(session({ secret: 'keyboard cat' }));
mountAuth(server);

server.use('/auth', authRoutes);

export default server;
