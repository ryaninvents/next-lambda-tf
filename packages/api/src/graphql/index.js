
// Construct a schema, using GraphQL schema language
const typeDefs = `
  type Query {
    hello: String
    now: String
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => 'Hello world!',
    now: () => new Date().toISOString()
  }
};

export { typeDefs, resolvers };
