import {
  // basic types
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLEnumType,

  // used to create required fields and arguments
  GraphQLNonNull,

  // used to create schema
  GraphQLSchema,

  // function used to execute GraphQL queries
  graphql
} from 'graphql'

const Query = new GraphQLObjectType({
  name: 'RootQueries',
  fields: () => ({
    echo: {
      type: GraphQLString,
      args: {
        message: { type: GraphQLString },
      },
      resolve: function(source, args) {
        return `received: ${args.message}`
      }
    }
  })
})

const Schema = new GraphQLSchema({
  query: Query
})

/////////////////////////////////////////////////

// run command in console: 
// $ babel-node index.js --presets "es2015"

// start to query, use 'graphql' function
let query = 
`
  {
    receivedMsg: echo(message: "Hello")
  }
`
graphql(Schema, query)
  .then(function(result) {
    console.log(result)
  })
  .catch(function(err) {
    console.log(err)
  })

// query with variables
query = 
`
  query getEcho($inputMsg: String) {
    receivedMsg: echo(message: $inputMsg)
  }
`

// graphql(Schema, query, null)
graphql(Schema, query, null, null, {inputMsg: "hello"})
  .then(function(result) {
    console.log(result)
  })
  .catch(function(err) {
    console.log(err)
  })
