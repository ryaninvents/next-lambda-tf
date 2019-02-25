import { ApolloServer } from 'apollo-server-lambda';
import lambdaPlayground from 'graphql-playground-middleware-lambda';
import { typeDefs, resolvers } from './graphql';

const graphqlHandler = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
  introspection: true
}).createHandler();

export const api = graphqlHandler;

export const playground = lambdaPlayground({
  endpoint: '/graphql'
});
