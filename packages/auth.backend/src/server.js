import express from 'express';
import logger from '@~/log';
import expressWinston from 'express-winston';

const server = express();

server.use(expressWinston.logger({
  winstonInstance: logger
}));

export default server;
