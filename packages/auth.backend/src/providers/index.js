import express from 'express';
import registerGoogle from './google';
import passport from 'passport';
import logger from '@~/log';
import config from '../config';
import * as models from '../models';

const PROVIDERS = [registerGoogle];

const authRoutes = new express.Router();

const initializer = passport.initialize();
const passportSession = passport.session();

PROVIDERS.forEach((register) => {
  register({
    config,
    passport,
    log: {
      ...logger,
      event: (eventName, payload) => ({ event: eventName, payload })
    },
    router: authRoutes,
    models
  });
});

passport.serializeUser(function (user, done) {
  console.log('serializeUser', ...arguments);
  done(null, user.id);
});
passport.deserializeUser(async function (id, done) {
  try {
    const user = await models.Consumer.getById(id);
    if (!user) {
      throw new Error(`User "${id}" not found`);
    }
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export function mountAuth (server, opts) {
  server.use(initializer);
  server.use(passportSession);
}

authRoutes.get('/whoami', (req, res) => {
  res.json(req.user || null);
});

export default authRoutes;
