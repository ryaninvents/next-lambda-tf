import sls from 'serverless-http';
import server from './server';

export const handler = sls(server, {
  request (req) {
    if (typeof req.socket.destroy !== 'function') {
      req.socket.destroy = function mockDestroy () {};
    }
  }
});
