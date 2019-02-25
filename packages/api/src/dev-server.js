import expressGraphql from 'express-graphql';
import expressPlayground from 'graphql-playground-middleware-express';
import server from './server';
import { makeExecutableSchema } from 'graphql-tools';
import { typeDefs, resolvers } from './graphql';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

server.post('/graphql', (req, res, next) => expressGraphql({
  graphiql: true,
  schema
})(req, res, next));

server.get('/graphql', expressPlayground({
  endpoint: '/graphql',
  settings: {
    'general.betaUpdates': false,
    'editor.cursorShape': 'line',
    'editor.fontSize': 14,
    'editor.fontFamily': "'IBM Plex Mono', 'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
    'editor.theme': 'light',
    'editor.reuseHeaders': true,
    'prettier.printWidth': 80,
    'request.credentials': 'include',
    'tracing.hideTracingResponse': true
  }
}));

const port = parseInt(process.env.PORT, 10) || 3000;

server.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
