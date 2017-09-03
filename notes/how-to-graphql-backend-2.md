## Backend

在前面我们实现了一个仿 HackerNews 的前端，而后端是用了 graphcool 提供的服务，而此部分内容，就是在讲授我们自己如何来实现一个和 graphcool 一样功能的后端。

### graphql-ruby

Ref: <https://www.howtographql.com/graphql-ruby/0-introduction/>

有了前面的练习，ruby / rails 版的 Hackernews GraphQL 后端的实现理解起来就完全没有任何困难了，主要还是定义各种 type，以及实现相应的 resolvers。笔记会写得更加简单。

对比 rails 和 js 版 GraphQL 的实现，我发现其实 js 的代码还是简洁一些，在 js 面前，ruby 显示更强类型一些。

1. type 定义的对比。

   js 中支持在字符串中用 type 定义一个类型，然后用 makeExecutableSchema 方法将字符串 schema 转换成真正可用的 schema：

        const typeDefs = `
          type Query {
            allLinks(filter: LinkFilter, skip: Int, first: Int): [Link!]!
          }

          type Link {
            id: ID!
            url: String!
            description: String!
            postedBy: User
            votes: [Vote!]!
          }
          //...
        `

        module.exports = makeExecutableSchema({typeDefs, resolvers});

   而 ruby 的 gem 中并没有 makeExecutableSchema 这样好用的方法，必须明确定义一个单独的类型：

        Types::LinkType = GraphQL::ObjectType.define do
          name 'Link'

          field :id, !types.ID
          field :url, !types.String
          field :description, !types.String
          field :postedBy, -> { Types::UserType }, property: :user
          field :votes, -> { !types[Types::VoteType] }
        end

2. schema 的定义和 resolvers

   js 中 schema 和 resolvers 实现是完全分离的，schema 完全定义在字符串中，包括 query 和 mutation 的参数及类型，返回值，resolver 中就是单纯地实现，没有任何定义或声明。

   而 ruby 中，两者的界限没有那么明显，在 schema 或者说是类型的定义中，可以直接实现相应的 resolver，也可以把 resolver 定义到一个单独的类中。而且，ruby 中的 graphql，query 和 mutation 的参数及类型，还有返回值，是可以在 resolver 中定义的，可以说是你中有我，我中有你。所以，从这一点上来说，ruby 算得上更灵活一点? 还是复杂一些?

        # ruby
        Types::QueryType = GraphQL::ObjectType.define do
          name "Query"

          # resolver 如果比较简单的话可以直接在类型的定义中实现
          field :allLinks, !types[Types::LinkType] do
            resolve -> (obj, args, ctx) { Link.all }
          end
          # or
          # allLinks 需要的参数 filter / first / skip，以及返回值定义在 LinksSearch resolver 中
          field :allLinks, function: Resolvers::LinksSearch
        end

        // js
        const typeDefs = `
          type Query {
            allLinks(filter: LinkFilter, skip: Int, first: Int): [Link!]!
          }
          //...
        `

#### Getting Started

实始化一个 rails project，安装 graphql gem，运行 `rails g graphql:install` 会生成 graphql 所需的初始代码和文件夹，包括 `/grahpql` 和 `/graphiql` 路由，`GraphqlController` 的实现，`HackernewsRailsSchema` 的定义，代码很好理解，自己看源码吧。

(还是稍做一些解释)，首先从路由着手：

    post "/graphql", to: "graphql#execute"

接着看 GraphqlController 中 execute 方法的实现：

    def execute
      variables = ensure_hash(params[:variables])
      query = params[:query]
      operation_name = params[:operationName]
      context = {
        # we need to provide session and current user
        session: session,
        current_user: current_user
      }
      result = HackernewsRailsSchema.execute(query, variables: variables, context: context, operation_name: operation_name)

      render json: result
    end

前面几行代码都是解析参数，然后将这些参数传给最核心的一行实现：`HackernewsRailsSchema.execute()`。很明显，HackernewsRailsSchema 就是我们定义的 graphql schema，它的定义也很简单：

    HackernewsRailsSchema = GraphQL::Schema.define do
      mutation(Types::MutationType)
      query(Types::QueryType)
    end

接下来就不用看了，因为我们会在 Types::MutationType 中定义很多 mutations，在 Types::QueryType 中定义很多 query，它们都有相应的 resolovers。`HackernewsRailsSchema.execute()` 内部会去调用 query 或 mutation 相应的 resolvers，而我们的任务就是实现这些 resolvers。

#### Queries

实现 allLinks query。

首先生成 Link model：

    rails generate model Link url:string description:text
    rails db:migrate

定义 graphql LinkType：

    # app/graphql/types/link_type.rb
    # defines a new GraphQL type
    Types::LinkType = GraphQL::ObjectType.define do
      # this type is named `Link`
      name 'Link'

      # it has the following fields
      field :id, !types.ID
      field :url, !types.String
      field :description, !types.String
    end

定义 allLinks query 并实现它的 resolver，因为目前这个 resolver 的实现还很简单，所以可以直接把它的实现和定义放在一起，后面变复杂后，就需要拆出来放在一个单独的类中：

    # app/graphql/types/query_type.rb
    Types::QueryType = GraphQL::ObjectType.define do
      name 'Query'

      # queries are just represented as fields
      field :allLinks, !types[Types::LinkType] do
        # resolve would be called in order to fetch data for that field
        resolve -> (obj, args, ctx) { Link.all }
      end
    end

resolver 的三个参数 obj，args，ctx 和 js 中是一样的，不多做解释了。

> Resolvers are functions that the GraphQL server uses to fetch the data for a specific query. Each field of your GraphQL types needs a corresponding resolver function. When a query arrives at the backend, the server will call those resolver functions that correspond to the fields that are specified in the query.

#### Mutations

定义并实现 createLink mutation。

因为 createLink resolver 的实现有点复杂，所以我们把它放到一个单独的类中。如果用一个单独的类来表示 resolver，那么 query 或 mutatiton 的参数和返回值也是定义在 resolver 中，所以这个 resolver 即是实现，又是声明。

    # app/graphql/resolvers/create_link.rb
    class Resolvers::CreateLink < GraphQL::Function
      # arguments passed as "args"
      argument :description, !types.String
      argument :url, !types.String

      # return type from the mutation
      type Types::LinkType

      # the mutation method
      # _obj - is parent object, which in this case is nil
      # args - are the arguments passed
      # _ctx - is the GraphQL context (which would be discussed later)
      def call(_obj, args, _ctx)
        Link.create!(
          description: args[:description],
          url: args[:url],
        )
      end
    end

然后把 createLink 这个 mutation 在最顶层的 MutationType 中声明：

    # app/graphql/types/mutation_type.rb
    Types::MutationType = GraphQL::ObjectType.define do
      name 'Mutation'

      field :createLink, function: Resolvers::CreateLink.new
    end

#### Authentication

实现注册和登录，认证用户。流程和 js 中一样，只不过 token 的生成方式和管理方式不一样。js 例子中 token 是放在 request header 中，ruby 中是放在 session 中了 (所以只能在网页上使用)。

1. 生成 User model
1. 实现 createUser mutation resolver
1. 实现 signinUser mutation resolver
1. Authenticating requests

   在 `GraphqlController#execute` 方法，从 session 中取出 token，通过 token 找到 user 作为 `current_user`，把 `current_user` 放到 context 中传给所有的 resolvers。

   在 signinUser resolver 的实现中，生成 token，存入 session 中。

1. Linking User to Created Links

   为 Link model 增加 User 的 reference，给 LinkType 增加 postedBy 属性：

        Types::LinkType = GraphQL::ObjectType.define do
          name 'Link'

          field :id, !types.ID
          field :url, !types.String
          field :description, !types.String
          # add postedBy field to Link type
          # - "-> { }": helps against loading issues between types
          # - "property": remaps field to an attribute of Link model
          field :postedBy, -> { Types::UserType }, property: :user
        end

   在 createLink resolver 中，生成 link 时，把 context 中的 `current_user` 作为 link 的 user 存入数据库。

        class Resolvers::CreateLink < GraphQL::Function
          argument :description, !types.String
          argument :url, !types.String

          type Types::LinkType

          def call(obj, args, ctx)
            Link.create!(
              description: args[:description],
              url: args[:url],
              user: ctx[:current_user]
            )
          end
        end

这一小节中有解释为什么 signinUser 是作为 mutation 而不是 query：

> Now that you have users, how would you sign them in using GraphQL? With a new mutation, of course! Mutations are a way for the client to talk to the server whenever it needs an operation that isn’t just about fetching data.

#### Connecting Nodes

实现投票功能。

1. 生成 Vote model
1. 定义 schema VoteType
1. 实现 createVote mutation resolver
1. Relating links with their votes
1. Relating users with their votes

#### Error Handling

ruby 中的 graphql 只能自动处理 GraphQL::ExecutionError 类型的错误，因此如果捕捉到其它类型的错误，要把它转换成这个类型的错误。

例子：

    class Resolvers::CreateLink < GraphQL::Function
      argument :description, !types.String
      argument :url, !types.String

      type Types::LinkType

      def call(obj, args, ctx)
        Link.create!(
          description: args[:description],
          url: args[:url],
          user: ctx[:current_user]
        )
      rescue ActiveRecord::RecordInvalid => e
        # this would catch all validation errors and translate them to GraphQL::ExecutionError
        GraphQL::ExecutionError.new("Invalid input: #{e.record.errors.full_messages.join(', ')}")
      end
    end

#### Filtering

为 allLinks 增加 filter 参数。用了 gem 来实现这个功能，但不用 gem 手动实现应该也是挺简单的吧。

用的 gem：

    gem 'search_object'
    gem 'search_object_graphql'

实现了 LinksSearch query resolver，具体实现略，看代码。

用 LinksSearch 替代原来 inline 的 resolver：

    Types::QueryType = GraphQL::ObjectType.define do
      name 'Query'

      field :allLinks, function: Resolvers::LinksSearch
    end

#### Pagination

为 allLinks 增加 first 和 skip 参数，直接在 LinksSearch 中实现：

    require 'search_object/plugin/graphql'

    class Resolvers::LinksSearch
      # ...code

      option :filter, type: LinkFilter, with: :apply_filter
      option :first, type: types.Int, with: :apply_first
      option :skip, type: types.Int, with: :apply_skip

      def apply_first(scope, value)
        scope.limit(value)
      end

      def apply_skip(scope, value)
        scope.offset(value)
      end

      # ...code
    end

#### Summary

ruby 的 graphql 的教程没有涉及 dataloader 的内容。

Done@2017.9.3
