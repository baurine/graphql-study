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
