## Backend

在前面我们实现了一个仿 HackerNews 的前端，而后端是用了 graphcool 提供的服务，而此部分内容，就是在讲授我们自己如何来实现一个和 graphcool 一样功能的后端。

### Graphcool

Ref: <https://www.howtographql.com/graphcool/0-introduction/>

略。内容基本在 React + Apollo 中都覆盖了，只有为所有 Type 设置 Permission 和 Subscription 部分的内容值得仔细看看。

### graphql.js

Ref: <https://www.howtographql.com/graphql-js/1-getting-started/>

这篇笔记是在完成此节的所有练习后补充的笔记，因为练习完后发现，整个过程就是在定义 schema 和实现相应的 resolvers，因此很多逻辑是相似的，笔记会写得很简单。

#### Getting Started

初始化一个最基本的 node & express 项目，启动之。

引入 graphql 相关的库：`graphql-tools`、`apollo-server-express`、`graphql`。

`graphql-tools` 用来将定义的简化版的 schema 转化成真正可用的 schema，或者说是将字符串的 schema 转换化 GraphQLSchema 对象。

因此我们定义一个 `src/schema/index.js` 的文件来存放我们所有的 schema，目前只有一个 Link 的数据类型的定义：

    // src/schema/index.js
    const {makeExecutableSchema} = require('graphql-tools');

    // Define your types here.
    const typeDefs = `
      type Link {
        id: ID!
        url: String!
        description: String!
      }
    `;

    // Generate the schema object from your types definition.
    module.exports = makeExecutableSchema({typeDefs});

使用 `appolo-server-express` 来处理所有的 GraphQL API 请求，它接收请求，并用我们定义的 schema 来处理这些请求，代码片断：

    // This package will handle GraphQL server requests and responses
    // for you, based on your schema.
    const {graphqlExpress} = require('apollo-server-express');
    const schema = require('./schema');

    var app = express();
    // 用 graphqlExpress 来处理发往 /graphql API 的请求
    // graphqlExpress 用我们定义的 schema 来处理这些请求
    app.use('/graphql', bodyParser.json(), graphqlExpress({schema}));

#### Queries

实现第一个查询。

首先，定义顶层的 Query：

    const typeDefs = `
      type Link {
        id: ID!
        url: String!
        description: String!
      }

      type Query {
        allLinks: [Link!]!
      }
    `;

实现相应的 resolver，实现在 `src/schema/resolvers.js` 中。我们要在 resolver 中实现，该如何来响应 allLinks 查询，该返回什么样的数据，从定义来看，应该返回一个 Link 的数组。因为暂时没有数据库，我们先返回假数据，之后应该用数据库真实的数据替代：

    // src/schema/resolvers.js
    const links = [
      {
        id: 1,
        url: 'http://graphql.org/',
        description: 'The Best Query Language'
      },
      {
        id: 2,
        url: 'http://dev.apollodata.com',
        description: 'Awesome GraphQL Client'
      },
    ];

    module.exports = {
      Query: {
        allLinks: () => links,
      },
    };

因为有了 resolvers 了，修改 `src/schema/index.js`，为 makeExecutableSchema 加上 resolvers 参数：

    const {makeExecutableSchema} = require('graphql-tools');
    const resolvers = require('./resolvers');

    // ...

    module.exports = makeExecutableSchema({typeDefs, resolvers});

使用 `apollo-server-express` 提供的 GraphiQL 作用 playground：

    const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');

    // ...

    app.use('/graphiql', graphiqlExpress({
      endpointURL: '/graphql',
    }));

在命令行启动项目：`node src/index.js`，在浏览器中打开 `localhost:3000/graphiql` 体验吧。

#### Mutations

在 `src/schema/index.js` 中定义 createLink mutation，以及在 `src/schema/resolvers.js` 中实现相应的 resolver。

    type Mutation {
      createLink(url: String!, description: String!): Link
    }

resolver：

    module.exports = {
      Query: {
        allLinks: () => links,
      },
      Mutation: {
        createLink: (_, data) => {
          const newLink = Object.assign({id: links.length + 1}, data);
          links.push(newLink);
          return newLink;
        }
      },
    };

看上面，在 mutation 的定义中，我们接收两个参数，url 和 description，那这两个参数是怎么传到 mutation 的 resolver 中的呢，看上面 createLink resolover 的定义，第二个参数 data，就是我们传过去的参数，此时它等于 `{ url: xxx, description: yyy }`，后面还会接触到更多的参数。

resolver 实现的逻辑很简单，用接收的参数生成一个新的 Link 对象，并把它放入原来的 links 数组中，并返回这个新的 Link 对象。

接着你在浏览器中用 allLinks query 就能查询到新的 links 了。

#### Connectors

使用 MongoDB 来存储数据。

安装配置 mongodb，略。

我们把上例中的 links 数组转移到 mongodb 中，在 mongodb 中它称之为集合，collection。我们在程序启动时，连接 mongodb 数据库 (启动前先启动 mongodb 数据库)，然后从中获取 links 集合 (只是得到它的句柄，并不会查询出所有数据，相当于只是拿到了它的表名或游标)。

    // src/mongo-connector.js
    const {MongoClient} = require('mongodb');

    // 1，定义了此项目在 mongodb 中的数据库叫 hackernews
    const MONGO_URL = 'mongodb://localhost:27017/hackernews';

    // 2
    module.exports = async () => {
      const db = await MongoClient.connect(MONGO_URL);
      return {Links: db.collection('links')};
    }

修改 `src/index.js` 的启动过程：

    //...
    // 1
    const connectMongo = require('./mongo-connector');
    // 2
    const start = async () => {
      // 3，连接 mongodb
      const mongo = await connectMongo();
      var app = express();
      app.use('/graphql', bodyParser.json(), graphqlExpress({
        context: {mongo}, // 4，将 mongodb 实例放到 context 中传给 graphql resovlers
        schema
      }));
      //...
    };

    // 5
    start();

上面所说到的 context 我们很快可以看到它的用处。

修改 resolvers，从数据库中读取或写入数据。

    module.exports = {
      Query: {
        allLinks: async (root, data, {mongo: {Links}}) => { // 1
          return await Links.find({}).toArray(); // 2
        },
      },

      Mutation: {
        createLink: async (root, data, {mongo: {Links}}) => {
          const response = await Links.insert(data); // 3
          return Object.assign({id: response.insertedIds[0]}, data); // 4
        },
      },

      Link: {
        id: root => root._id || root.id, // 5
      },
    };

从上面可以看到，resolver 的第三个参数就是 context，目前里面只有 mongo 一个值，而 mongo 里只有 Links 一个集合，后面 context 会有更多的值，mongo 也会有更多的集合。

那第一个参数 root 是干嘛的呢，对于顶层的 Query 和 Mutation 来说，这个值是 null，没有意义，但对于其它数据类型来说，这个 root 代表对象自身 (一般是对应的数据库中的记录对象) 。对了，并不是 query 和 mutation 才有对应的 resolver，每一个数据类型和它的属性，都有对应的 resolver，只不过它们都有默认实现 (返回数据库中记录的对应属性值)，我们不需要修改，如果你有特殊需求，就需要重写它的 resolver，正如上例中 Link 的 id 属性的 resolver。因为实现 mongodb 中的记录并没有 id 属性，而只有 `_id`，所以我们要自己做一下手动转换。

#### Authetication

实现注册和登录，记 createUser 和 signinUser mutation。(其实这里我有一点不明，为什么 signinUser 是 mutation 而不是 query)。

先来实现注册，三步走：1. 定义 schema；2. 实现 resolver (包括定义相应的数据库集合)；3. 测试。

1. 定义 schema：

        type Mutation {
            createLink(url: String!, description: String!): Link

            # Note that this mutation could receive the email and password directly
            # as arguments, with no problem. You're just using this "authProvider"
            # instead to mimic the signature generated by Graphcool, which will
            # make it easier to integrate this server implementation later with the 
            # code from the frontend tutorials.
            createUser(name: String!, authProvider: AuthProviderSignupData!): User
        }

        type User {
            id: ID!
            name: String!
            email: String
        }

        input AuthProviderSignupData {
            email: AUTH_PROVIDER_EMAIL
        }

        input AUTH_PROVIDER_EMAIL {
            email: String!
            password: String!
        }

2. 在 mongodb 中定义 users 集合，并实现相应的 resolver：

        // src/mongo-connector.js
        module.exports = async () => {
            const db = await MongoClient.connect(MONGO_URL);
            return {
                Links: db.collection('links'),
                Users: db.collection('users'),
            };
        }

        // src/schema/resolvers.js
        Mutation: {
            // Add this block right after the `createLink` mutation resolver.
            createUser: async (root, data, {mongo: {Users}}) => {
              // You need to convert the given arguments into the format for the
              // `User` type, grabbing email and password from the "authProvider".
              const newUser = {
                  name: data.name,
                  email: data.authProvider.email.email,
                  password: data.authProvider.email.password,
              };
              const response = await Users.insert(newUser);
              return Object.assign({id: response.insertedIds[0]}, newUser);
            },
        },

3. 在浏览器中测试。

再来实现登录，节省为两步走，定义 schema，实现 resolver。

    // src/schema/index.js
    type Mutation {
        signinUser(email: AUTH_PROVIDER_EMAIL): SigninPayload!
    }

    type SigninPayload {
        token: String
        user: User
    }

    // src/schema/resolvers.js
    Mutation: {
        // ...
        signinUser: async (root, data, {mongo: {Users}}) => {
            const user = await Users.findOne({email: data.email.email});
            if (data.email.password === user.password) {
              return {token: `token-${user.email}`, user};
            }
          },
        },
    }
    User: {
      // Convert the "_id" field from MongoDB to "id" from the schema.
      id: root => root._id || root.id,
    },

验证请求。有了账户机制后，要求登录用户在它的每个请求头中都带上从登录响应中得到的 token，然后服务器在收到请求后，首先取得 header 中的 token 来验证此用户是不是合法用户，如果是合法用户，那我们就得到了 `current_user`，把这个值放到 context 中传给每一个 resolver。

代码如下，很好理解，就不多做解释了：

    // src/index.js
    const {authenticate} = require('./authentication');

    const start = async () => {
      // ...

      const buildOptions = async (req, res) => {
        const user = await authenticate(req, mongo.Users);
        return {
          context: {mongo, user}, // This context object is passed to all resolvers.
          schema,
        };
      };
      app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));

      // ...
    }

    // src/authentication.js
    const HEADER_REGEX = /bearer token-(.*)$/;

    /**
    * This is an extremely simple token. In real applications make
    * sure to use a better one, such as JWT (https://jwt.io/).
    */
    module.exports.authenticate = async ({headers: {authorization}}, Users) => {
      const email = authorization && HEADER_REGEX.exec(authorization)[1];
      return email && await Users.findOne({email});
    }

接下来我们就来用用户认证机制做点事情。用户 createLink 后，我们来为这个 link 关联创建这个 link 的 user。

首先我们更新 Link type 的定义，加上 `postedBy` 属性：

    type Link {
        id: ID!
        url: String!
        description: String!
        postedBy: User
    }

注意 (我也是才明白)，这里的 Link 的定义，并不和 mongodb 中 links 集合的定义一致，在 mongodb 中没有 postedBy 属性，取而代之的是 postedById 属性，因此稍候我们要通过 postedById 来取得对应的 user。

所以，要明白，在 schema 中定义的这些数据类型，和 mongodb 中的记录并没有关系，它们仅仅是 API 的规范。它们和数据库的记录之间完全是通过 resolver 来关联的。

更新 createLink resolver，为 mongodb 中的 link 记录加上 postedById 值：

    Mutation: {
        createLink: async (root, data, {mongo: {Links}, user}) => {
            const newLink = Object.assign({postedById: user && user._id}, data)
            const response = await Links.insert(newLink);
            return Object.assign({id: response.insertedIds[0]}, newLink);
        },
    },

同时，我们在获取 Link 时，要根据 link 的 postedById 属性值来得到相应的 user，因此，我们要为 Link 的 postedBy 属性实现 resolver，替代默认的 resolver：

    Link: {
        id: root => root._id || root.id,

        postedBy: async ({postedById}, data, {mongo: {Users}}) => {
            return await Users.findOne({_id: postedById});
        },
    },

测试，请求头中加上 token，这本来应该是在客户端做的，不过我们这里没有客户端，就直接在服务器 hard-code 一下：

    // src/index.js
    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/graphql',
        passHeader: `'Authorization': 'bearer token-foo@bar.com'`,
    }));

#### More Mutations

实现投票功能。

1. 定义 Vote 类型
1. 定义 createVote mutation
1. mongodb 中增加 votes 集合
1. 实现 createVote resolver 和 Vote 的 user / link 属性的 resolver

示例代码：

    // src/schema/index.js
    // 1 - define Vote type
    type Vote {
      id: ID!
      user: User!
      link: Link!
    }

    // 2 - define createVote mutation
    type Mutation {
      //...
      createVote(linkId: ID!): Vote
    }

    // src/mongo-connector.js
    // 3 - add votes collection
    module.exports = async () => {
      const db = await MongoClient.connect(MONGO_URL);
      return {
        Links: db.collection('links'),
        Users: db.collection('users'),
        Votes: db.collection('votes'),
      };
    }

    // src/schema/resolvers.js
    // 4 - implement resolvers
    const {ObjectID} = require('mongodb')
    module.exports = {
      // ...
      Mutation: {
        // ...
        createVote: async (root, data, {mongo: {Votes}, user}) => {
          const newVote = {
            userId: user && user._id,
            linkId: new ObjectID(data.linkId),
          };
          const response = await Votes.insert(newVote);
          return Object.assign({id: response.insertedIds[0]}, newVote);
        },
      },
      Vote: {
        id: root => root._id || root.id,

        user: async ({userId}, data, {mongo: {Users}}) => {
          return await Users.findOne({_id: userId});
        },

        link: async ({linkId}, data, {mongo: {Links}}) => {
          return await Links.findOne({_id: linkId});
        },
      },
    }

Relating links with their votes，略。Relating Users with their votes，略。都是一样的步骤。

#### Using dataloaders

GraphQL 的一大缺点是，相比 RESTful API，对数据库的查询量会多很多。RESTful API 查询数据库时，可以通过一条语句从数据库中得到批量数据，而 GraphQL 是一种分而治之的思想，每一个属性都有一个单独的 resolver，在每一个 resolver 中对数据库进行查询。

dataloader 是一种解决办法，具体怎么实现的暂时还不知道，这其中应该也有缓存的作用?

使用 dataloader 之后，resolver 中就不再直接查询数据库了，而是从 dataloader 中查询，dataloader 相当于是包装了原始的数据库操作。

示例代码：

    // src/index/resolvers.js
    Link: {
      // ...
      postedBy: async ({postedById}, data, {dataloaders: {userLoader}}) => {
        return await userLoader.load(postedById);
      },
    },
    Vote: {
      // ...
      user: async ({userId}, data, {dataloaders: {userLoader}}) => {
        return await userLoader.load(userId);
      },
    },

这一小节的内容应该是比较重要的，但目前暂时了解一下就行。实际应用中需要再深入学习。

#### Error Handling

可以在 resolver 中直接抛出一个异常，graphql 库会自动捕捉这个异常并返回给客户端。

另外，可以自己定义一个 error handler，用来包装或处理原来的错误，可以在原来错误的基础上补充更多的信息返回给客户端。

示例代码，比如在 createLink resolver 中增加对 url 的验证：

    const {URL} = require('url');

    function assertValidLink ({url}) {
      try {
        new URL(url);
      } catch (error) {
        throw new Error('Link validation error: invalid url.');
      }
    }

    module.exports = {
      // ...
      Mutation: {
        createLink: async (root, data, {mongo: {Links}, user}) => {
          assertValidLink(data);
          const newLink = Object.assign({postedById: user && user._id}, data)
          const response = await Links.insert(newLink);
          return Object.assign({id: response.insertedIds[0]}, newLink);
        },
      },
    }

自己定义 error handler，略，直接看代码吧。

#### Subscriptions

(最后实践没有成功。)

订阅发布功能的实现。

实现原理：在服务端生成一个全局唯一的 PubSub 对象，这个对象里有很多个主题，客户端可以订阅到某个主题上，服务端有新的数据产生后，向这个 PubSub 对象的某个主题发布事件，订阅了这个主题的客户端就可以收到相应的事件和数据。

PubSub 对象由 `graphql-subscriptions` 库实现。

定义 Subscription schema，目前只订阅 Link 数据的变化：

    // src/schema/index.js
    type Subscription {
      Link(filter: LinkSubscriptionFilter): LinkSubscriptionPayload
    }

    input LinkSubscriptionFilter {
      mutation_in: [_ModelMutationType!]
    }

    type LinkSubscriptionPayload {
      mutation: _ModelMutationType!
      node: Link
    }

    enum _ModelMutationType {
      CREATED
      UPDATED
      DELETED
    }

生成全局 PubSub 对象，所有请求共享：

    // src/pubsub.js
    const {PubSub} = require('graphql-subscriptions');
    module.exports = new PubSub();

实现 Subscription 中 Link 类型的 resolver，只需要实现它的 subscribe 方法，而这个方法的实现只需要把它订阅到 PubSub 对象的 'Link' 主题上：

    // src/schema/resolver.js
    const pubsub = require('../pubsub');
    Subscription: {
      Link: {
        subscribe: () => pubsub.asyncIterator('Link'),
      },
    },

然后，服务端如果有新的 Link 产生，就要发布到 PubSub 对象的 'Link' 主题上：

    // src/schema/resolver.js
    Mutation: {
      createLink: async (root, data, {mongo: {Links}, user}) => {
        assertValidLink(data);
        const newLink = Object.assign({postedById: user && user._id}, data)
        const response = await Links.insert(newLink);

        newLink.id = response.insertedIds[0]
        pubsub.publish('Link', {Link: {mutation: 'CREATED', node: newLink}});

        return newLink;
      },
    },

订阅功能基本 WebSocket 实现，因为我们就给服务器配置 websocket 功能，由 `subscriptions-transport-ws` 库实现，具体配置略。

#### Filtering

实现搜索功能，主要是给 allLinks query 增加 fiter 参数，然后在 resolver 中将这些查询参数使用到 mongodb 的查询中。

修改 allLinks query，增加 filter 参数：

    type Query {
      allLinks(filter: LinkFilter): [Link!]!
    }

    input LinkFilter {
      OR: [LinkFilter!]
      description_contains: String
      url_contains: String
    }

实现 resolver：

    // ...
    function buildFilters({OR = [], description_contains, url_contains}) {
      const filter = (description_contains || url_contains) ? {} : null;
      if (description_contains) {
        filter.description = {$regex: `.*${description_contains}.*`};
      }
      if (url_contains) {
        filter.url = {$regex: `.*${url_contains}.*`};
      }

      let filters = filter ? [filter] : [];
      for (let i = 0; i < OR.length; i++) {
        filters = filters.concat(buildFilters(OR[i]));
      }
      return filters;
    }

    module.exports = {
      Query: {
        allLinks: async (root, {filter}, {mongo: {Links, Users}}) => {
          let query = filter ? {$or: buildFilters(filter)} : {};
          return await Links.find(query).toArray();
        },
      },
      //...
    };

#### Pagniation

给 allLinks query 增加 skip 和 first 参数，用来实现数据库的分页查询。

    // src/schema/index.js
    type Query {
      allLinks(filter: LinkFilter, skip: Int, first: Int): [Link!]!
    }

    // src/schema/resolvers.js
    Query: {
      allLinks: async (root, {filter, first, skip}, {mongo: {Links, Users}}) => {
        let query = filter ? {$or: buildFilters(filter)} : {};
        const cursor = Links.find(query)
        if (first) {
          cursor.limit(first);
        }
        if (skip) {
          cursor.skip(skip);
        }
        return cursor.toArray();
      },
    },

#### Summary

More playgroud: [LaunchPad](https://launchpad.graphql.com/)

Done@2017.9.2
