const rc = require('rc');
const dev = process.env.NODE_ENV !== 'production';

const config = {};

config.getAuthUrl = (path) => `http://localhost:3000/auth/${path}`;
config.getFrontendLocation = (path = '') => `http://localhost:3000/frontend/${path}`;

if (dev) {
  Object.assign(config, rc('site'));
}

export default config;
