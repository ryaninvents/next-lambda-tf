import get from 'lodash/get';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { resolve } from 'url';

const DEFAULT_GOOGLE_SCOPES = [
  `https://www.googleapis.com/auth/userinfo.email`,
  `https://www.googleapis.com/auth/userinfo.profile`
];

function registerGoogleStrategy ({ config, passport, log, router, models: { Consumer } }) {
  const googleConfig = config.google;
  passport.use(new GoogleStrategy({
    clientID: get(googleConfig, 'clientId'),
    clientSecret: get(googleConfig, 'clientSecret'),
    callbackURL: config.getAuthUrl('google/callback'),
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    passReqToCallback: true
  }, async (req, token, tokenSecret, profileResponse, done) => {
    console.log({ token, tokenSecret, profileResponse, done });
    try {
      log.event('auth-attempt', profileResponse);
      const consumer = await Consumer.ensureFromForeignProfile('google', profileResponse);
      done(null, consumer);
    } catch (error) {
      console.log(error);
      done(error);
    }
  }));
  let scope = get(googleConfig, 'scope', DEFAULT_GOOGLE_SCOPES);
  // if (Array.isArray(scope)) {
  //   scope = scope.join(',');
  // }

  router.get('/google', (req, ...rest) => {
    const returnPath = get(req, 'query.returnPath', '/');
    if (req.session) req.session.returnPath = returnPath;
    passport.authenticate('google', { scope })(req, ...rest);
  });
  router.get('/google/callback', (req, ...rest) => {
    const returnPath = get(req, 'session.returnPath', '');
    if (req.session) delete req.session.returnPath;
    passport.authenticate('google', {
      successRedirect: resolve(config.getFrontendLocation(), returnPath),
      failureRedirect: resolve(config.getFrontendLocation(), `${returnPath}?error=true`)
    })(req, ...rest);
  });
}

export default registerGoogleStrategy;
