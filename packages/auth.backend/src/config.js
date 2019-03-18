import get from 'lodash/get';
import logger from '@~/log';
const dev = process.env.NODE_ENV !== 'production';

const Config = {
  protocol: 'https',
  hosts: {
    api: process.env.API_HOST,
    auth: process.env.AUTH_HOST,
    frontend: process.env.FRONTEND_HOST
  },
  getAuthUrl (path) {
    return `${Config.protocol}://${Config.hosts.auth}/auth/${path}`;
  },
  getFrontendLocation (path = '') {
    return `${Config.protocol}://${Config.hosts.frontend}/${path}`;
  },
  sessions: {
    key: process.env.SESSIONS_SECRET_KEY,
    table: process.env.SESSIONS_TABLE,
    region: process.env.SESSIONS_AWS_REGION
  },
  tables: {
    foreignProfiles: process.env.FOREIGN_PROFILES_TABLE,
    users: process.env.USERS_TABLE
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
  },
  cognito: {
    userPoolId: process.env.USER_POOL_ID
  },
  getEndpoint (service) {
    return get(Config, ['aws.endpoints', service], null);
  },
  get (...args) {
    return get(Config, ...args);
  },
  getCookieDomain () {
    // TODO: implement in a less-hacky manner
    return Config.get('hosts.frontend')
      // strip off port number
      .split(':')[0]
      // strip off first subdomain
      .split('.').slice(1).join('.');
  },
  getCorsConfig () {
    const whitelist = [...new Set([
      Config.hosts.api,
      Config.hosts.auth,
      Config.hosts.frontend
    ])];
    return {
      origin (origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        const originHost = origin.replace(/^https?:\/\//, '');
        if (!whitelist.includes(originHost)) {
          const errMsg = `Origin "${origin}" not permitted`;
          logger.error(errMsg, { origin, whitelist });
          callback(new Error(errMsg));
          return;
        }
        callback(null, true);
      },
      credentials: true
    };
  }
};

if (dev) {
  const rc = require('rc');
  Object.assign(Config, {
    protocol: 'http',
    dev: true,
    hosts: {
      api: 'localhost:3000',
      auth: 'localhost:3000',
      frontend: 'localhost:3000'
    }
  }, rc('site'));
}

export default Config;
