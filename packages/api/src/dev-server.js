import expressGraphql from 'express-graphql';
import expressPlayground from 'graphql-playground-middleware-express';
import server from './server';
import { makeExecutableSchema } from 'graphql-tools';
import { typeDefs, resolvers } from './graphql';
import playgroundSettings from './graphql/playground-settings';

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
  settings: playgroundSettings
}));

const port = parseInt(process.env.PORT, 10) || 3000;

server.listen(port, err => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
