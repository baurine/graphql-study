# HowToGraphQL Note

Note for <https://www.howtographql.com/>

## GraphQL

### Fundamentals

#### Introduction

略。

#### GraphQL is the better REST

略。进行对比，说明 REST 的不足以及突显 GraphQL 的优势，用 GraphQL 是如何可以解决 REST 不足的这些问题的。但很明显也回避了 GraphQL 相比 REST 的缺点，比如不能缓存之类的，每次查询都是查询所有列...

#### Core Concepts

这一小节有些新内容：

1. 相比之前了解的 Schema 有 Query 和 Mutation 两部分，现在 Schema 增加了第三部分，Subscription，用来监听服务端的数据变化，相当于一种订阅机制 (用 WebSocket 实现?)。

1. type 的定义被极大的简化了。(或者是我理解错了，type 简化的这种定法是标准，并非实现，而 GraphQLObjectType 是 type 在 JavaScript 上的实现。)

   之前，用 GraphQLObjectType 定义：

        const Query = new GraphQLObjectType({
          name: 'BlogSchema',
          description: "Root of the Blog Schema",
          fields: () => ({
            posts: {
              type: new GraphQLList(Post),
              resolve: function() {
                return PostsList;  // PostsList 是一组 hardcode 的数组数据
              }
            }
          })
        });
  
   现在，直接用 type 关键字：

        type Query {
          allPersons(last: Int): [Person!]!
        }

        type Mutation {
          createPerson(name: String!, age: Int!): Person!
        }

        type Subscription {
          newPerson: Person!
        }

        type Person {
          name: String!
          age: Int!
          posts: [Post!]!
        }

        type Post {
          title: String!
          author: Person!
        }

#### Big Picture (Architecture)

GraphQL 只是一种标准，并不是一个实现的库。

服务端设计：略。每一个 field 都应该有一个 resolver function 来处理查询和修改逻辑。resolver function 可能包含隐式的参数。

    query {
      User(id: 'afkdsak') {
        name
        followers(first: 5) {
          name
          age
        }
      }
    }

对应的 resolver functions：

    User(id: String): User
    name(user: User!): String
    age(usre: User!): Int
    followers(first: Int, user: User!): [User!]!

可以看到 name、age 和 followers 都有隐含的类型为 User! 的参数 user。

客户端库的设计：略。

### Advanced

#### Clients

目前实现了 GraphQL 的两大客户端库：

1. Applo Client (有 iOS 和 Android 版本)
1. Facebook's Relay (只有 Web 版，且配合 React 使用)

其余略。

#### Server

稍微解释了一下服务端的实现原理，是如何响应从客户端发来的 query，然后从数据库查询数据并返回结果的。一句话概括，就是逐层调用每个字段相应的 resolver function。上面说到了每个字段都有相应的 resolver function 的，但你不用手动为每一个字段都定义的，在 graphql 的 js 版本实现中，每一个字段都有默认的 resolver function。

另外还提到了 DataLoader，用来过滤重复请求。

#### Tooling and Ecosystem

讲到了两点：

1. 自省，introspection
1. GraphiQL，很强大

自省，是可以让客户端自动查询得到服务端的 schema。(我觉得 ElasticSearch 也有类似的功能)。

    query {
      __schema {
        types {
          name
        }
      }
    }

    {
      __type(name: "Author") {
        name
        description
      }
    }

#### Security

这一小节主要是描述一些策略来降低 API 的滥用以减轻服务器的负担。GraphQL 为客户端提供了很大的灵活性，但牺牲的是服务端的性能。不合适的请求会让服务器消耗过多的资源和时间。

一些策略：

1. 为请求增加超时，比如如果某个请求的处理超过 5s，就中断所有查询，返回超时错误
1. 限制最大查询深度
1. 限制查询的复杂度
1. Throttling，其实是指限制 API 请求的频率。又分基本时间的限制和基于复杂度的限制。提供了一个算法，比如是基本时间的限制，每 1s 获得 100ms 的时间值，发一次请求要消耗 900ms 的时间值，因此每 9s 就可以攒够 900ms，就可以发一次请求了。

#### Common Questions

略。不过在这一小节中正视了 GraphQL 无法缓存请求结果的问题。

---

## Fronted

### React + Applo

实践，写一个 HackerNews 的 demo，前端用 react + applo，后端用 Graphcool。

#### Introduction

解释了一下各种工具和库的选择，主要是对比了两个 GraphQL client 库，Relay 和 Applo，前者过于复杂了，学习曲线太高，后者简单一些。

#### Getting Started

先大致了解一下 Graphcool 是干嘛的，大致就是一个帮我们托管后端数据的服务，并提供 GraphQL 形式的 API 来访问这些数据。免去我们自己建 GraphQL Server。

**Creating the GraphQL Server**

首先要在 Graphcool 的官网上注册账号 (直接用 Github 账号登录就行)，然后安装 graphcool 的 cli，实际后来我发现 cli 并不是必须的，因为你也可以直接在 Graphcool 的网页 console 上操作，但命令行确实也能带来一些便利，更重要的是可以把数据类型的声明带入代码版本控制中。graphcool cli 的很多操作和 git 相似，比如 `graphcool init/push/pull/status`。

    $ npm install -g graphcool
    $ graphcool init --schema https://graphqlbin.com/hn-starter.graphql --name Hackernews

第一条命令是安装 graphcool cli，第二条命令是初始化一个 graphcool project，执行 `graphcool init` 时会自动打开浏览器，和你的 graphcool 账户关联上。`--schema` 指定此项目的初始 schema，`--name` 指定项目的名字，命令执行之后，你可以在 graphcool 的 console 页面看到有了一个新的 project Hackernews，并且在本地当前目录下生成了 `project.graphcool` 文件，可以用编辑器打开，它定义了数据类型。`graphcool push` 把 `project.graphcool` 推送到服务器，然后 graphcool 会根据定义的数据类型，自动生成相应的 query 和 mutation。比如在此例中定义了 `type Link {}`，然后就为它生成了相应的 `allLinks` `Link` query 和 `createLink` `updateOrCreateLink` `deleteLink` mutations (你可以在 graphcool console 的 playground 页面中看到生成的这些 schema)。

<https://graphqlbin.com/hn-starter.graphql> 的内容：

    type Link implements Node {
      description: String!
      url: String!
    }

生成的 project.graphcool 的内容：

    # project: cj6t4ldq40qde018487586tqg
    # version: 2

    type Link implements Node {
      url: String!
      description: String!
      createdAt: DateTime!
      id: ID! @isUnique
      updatedAt: DateTime!
    }
    ...

graphcool cli 的其它一些命令：

    $ graphcool console  # 在浏览器中打开 console 页面
    $ graphcool playground  # 在浏览器中打开 playgound 页面
    $ graphcool endpoints  # 获得 api url

其它一些不是很重要的步骤略。

**Creating the App**

用 create-react-app 初始化项目

    $ npm install -g create-react-app
    $ create-react-app hackernews-react-apollo

引入 react-apollo 库

    $ yarn add react-apollo

修改 index.js，uri 的值通过 `graphcool endpoints` 命令得到

    import { ApolloProvider, createNetworkInterface, ApolloClient } from 'react-apollo'

    const networkInterface = createNetworkInterface({
      // uri 的值是通过 `graphcool endpoints` 命令得到的 Simple API url
      uri: 'https://api.graph.cool/simple/v1/cj6t4ldq40qde018487586tqg'
    })

    const client = new ApolloClient({
      networkInterface
    })

    ReactDOM.render(
      <ApolloProvider client={client}>
        <App />
      </ApolloProvider> , document.getElementById('root')
    )

#### Queries: Loading Links

---

## Backend
