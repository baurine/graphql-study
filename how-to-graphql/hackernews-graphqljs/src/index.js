const express = require('express');
const bodyParser = require('body-parser');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const schema = require('./schema');
const { authenticate } = require('./authentication');
// 1
const connectMongo = require('./mongo-connector');
const buildDataloaders = require('./dataloaders');

// 2
const start = async () => {
  // 3
  const mongo = await connectMongo();
  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: {
        dataloaders: buildDataloaders(mongo),
        mongo,
        user
      }, // This context object is passed to all resolvers.
      schema,
    };
  };
  const app = express();
  app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));
  // you need create a user by email foo@bar.com to test
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    passHeader: `'Authorization': 'bearer token-foo@bar.com'`,
  }));

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Hackernews GraphQL server running on port ${PORT}.`)
  });
};

// 5
start();
