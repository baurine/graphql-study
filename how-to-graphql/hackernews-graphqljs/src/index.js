const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const schema = require('./schema');
const { authenticate } = require('./authentication');
// 1
const connectMongo = require('./mongo-connector');

// 2
const start = async () => {
  // 3
  const mongo = await connectMongo();
  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: {mongo, user}, // This context object is passed to all resolvers.
      schema,
    };
  };
  const app = express();
  app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
  }));

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Hackernews GraphQL server running on port ${PORT}.`)
  });
};

// 5
start();
