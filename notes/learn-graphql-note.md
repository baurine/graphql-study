# LearnGraphQL Note

Note for learning GraphQL in <https://learngraphql.com>.

## Reference

1. <https://learngraphql.com/>
1. <http://graphql.org/>

## Note

注意 GraphQL 分客户端和服务端两端，这里前半部分 (3 - 6 节) 讲的是如何在客户端使用，包括查询和修改。后半部分 (7 - 最后) 讲的是在服务端如何实现，包括定义 schema 和查询，修改的实现。

### 3. Querying GraphQL

#### 1. normal query

    {
      lastPost {
        _id,
        title
      }
    }

注意，此处 "{" 前没有冒号 ":"，不要和 JavaScript 对象混淆了。

#### 2. nest query

    {
      posts {
        title,
        summary,
        comments {
          content
        }
      }
    }

#### 3. argument

    {
      recentPosts(count: 5) {
        title
      }
    }

注意，这里有冒号 ":"，参数有可选和必选。

#### 4. multiple fields

    {
      lastestPost {
        title
      }

      authors {
        name
      }
    }

#### 5. assigning a result to a variable 

    {
      lastestPost: lastestPost {
        title
      }
      authorNames: authors {
        name
      }
      authoIds: authors {
        _id
      }
    }

注意，这里又有冒号 ":" 了，冒号前面是别名。
  
### 4. Invoking Mutations

前面是讲如何查询，现在是讲如何修改，一个是读，一个是写。这里的修改，包括新增和更新，删除。

#### 1. simple sample

    mutation {
      createAuthor(
        _id: 'john',
        name: 'John Carter',
        twitterHandle: '@john'
      ) {
        _id,
        name
      }
    }

与 query 关键字可以默认省略不同，mutation 关键字需要显示声明。

#### 2. multiple mutations

    mutation {
      sam: createAuthor(
        //...
      ) {
      }

      chris: createAuthor(
      ) {
      }
    } 

多个 mutation 会顺序执行，可能有些会失败，有些成功。

### 5. Fragments

Fragment 用于减少重复定义，在 GraphQL 中有重要作用。

#### 1. basic

    {
      arunoda: author(_id: "arunoda") {
        ...authorInfo
      },
      pahan: author(_id: "pahan") {
        ...authorInfo
      },
      indi: author(_id: "indi") {
        ...authorInfo
      }
    }

    fragment authorInfo on Author {
      _id,
      name,
      twitterHandle
    }

#### 2. mixing fragments and fields

    {
      indi: author(_id: "indi") {
        ...requiredAuthorInfo
        twitterHandle
      }
    }

    fragment requiredAuthorInfo on Author {
      _id,
      name,
    }

#### 3. fragments with nested fields

    {
      post1: post(_id: "03390abb5570ce03ae524397d215713b") {
        ...postInfo
      },
      post2: post(_id: "0176413761b289e6d64c2c14a758c1c7") {
        ...postInfo
      }
    }

    fragment postInfo on Post {
      title,
      content,
      author {
        name
      },
      comments {
        content
      }
    }

#### 4. fragments with nested fragments

    {
      post1: post(_id: "03390abb5570ce03ae524397d215713b") {
        ...postInfo
      },
      post2: post(_id: "0176413761b289e6d64c2c14a758c1c7") {
        ...postInfo
      }
    }

    fragment postInfo on Post {
      title,
      content,
      author {
        ...authorInfo
      },
      comments {
        content,
        author {
          ...authorInfo
        }
      }
    }

    fragment authorInfo on Author {
      _id, 
      name
    }

### 6. Query Variables

#### 1. basic

use variable to replace hardcode for query argument, like this: 

    {
      recentPosts(count: 10) {
        title
      }
    }

here 10 is hardcode.

#### 2. named queryies

前面的查询语法都是简写版，完整的写法如下：

    query getFewPosts {
      recentPosts(count: 10) {
        title
      }
    }

可以理解成前面是匿名查询，完整的语法是具名查询。

#### 3. using query variables

    query getFewPosts($postCount: Int!) {
      recentPosts(count: $postCount) {
        title
      }
    }

(我叉，这不就是相当于在写函数吗! 类似 gradle 中的写法，swift 中的写法，最后一个参数是 closure 的话就可以写成这样!)

(DSL ??)

#### 4. use query variables anywhere

    query getFewPosts($postCount: Int!, $commentCount: Int) {
      recentPosts(count: $postCount) {
        title,
        ...comments
      }
    }

    fragment comments on Post {
      comments(limit: $commentCount) {
        content
      }
    }

#### 5. input types

only can use:

1. Scalers such as Int, String, Float, Boolean
1. Enums
1. Arrays of the above types

Sample, here `Category` is Enums:

    query getFewPosts($category: Category) {
      posts(category: $category) {
        title
      }
    }

### 7. Defining Queries

这小节讲的是服务端的部分。服务端如何定义 schema。

schema 包括顶层的 query 和 mutation 两部分。每个 query 都是一个 GraphQLObjectType 对象，逐层嵌套。GraphQLObjectType 中包括 name、description、fields 字段。最重要的是 fields 字段，fields 是定义一个处理查询逻辑的函数，返回对象即是包括了我们所想查询的各个字段。每个字段又包括了这个字段的类型，参数 args，以及查询逻辑 resolve 函数。

[完整的示例代码](../hello-graphql/index.js)

#### 1. inspecting the schema

    cosnt Query = new GraphQLObjectType({
      //...
    })
    const Schema = new GraphQLSchema({
      query: Query
    })

#### 2. define the post type

    const Post = new GraphQLObjectType({
      name: "Post",
      description: "This represent a Post",
      fields: () => ({
        _id: {type: new GraphQLNonNull(GraphQLString)},
        title: {type: new GraphQLNonNull(GraphQLString)},
        content: {type: GraphQLString}
      })
    });

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

#### 3. defining default values

    const Post = new GraphQLObjectType({
      name: "Post",
      description: "This represent a Post",
      fields: () => ({
        _id: {type: new GraphQLNonNull(GraphQLString)},
        title: {
          type: new GraphQLNonNull(GraphQLString),
          resolve: function(post) {
            return post.title || "Does not exist";
          }
        },
        content: {type: GraphQLString}
      })
    });

#### 4. defining nested fields

    const Author = new GraphQLObjectType({
      name: "Author",
      description: "This represent an author",
      fields: () => ({
        _id: {type: new GraphQLNonNull(GraphQLString)},
        name: {type: GraphQLString}
      })
    });

    const Post = new GraphQLObjectType({
      name: "Post",
      description: "This represent a Post",
      fields: () => ({
        ...
        author: {
          type: Author,
          resolve: function(post) {
            return AuthorsList.find(a => a._id == post.author);
          }
        }
      })
    });

#### 5. finally 

?? 没有讲怎么定义参数啊...只是第一小节的例子有所提及。

后来看了后面的[示例代码](../hello-graphql/index.js)，原来在 query 中也是可以定义 args 属性的，就和 mutation 的定义几首一样了。

### 8. Defining Mutations

#### 1. hello mutations

    const Mutation = new GraphQLObjectType({
      name: "BlogMutations",
      description: "Mutations of our blog",
      fields: () => ({
        createPost: {
          type: Post,
          args: {
            title: {type: new GraphQLNonNull(GraphQLString)},
            content: {type: new GraphQLNonNull(GraphQLString)}
          },
          resolve: function(source, args) {
            let post = Object.assign({}, args);
            // Generate the _id
            post._id = `${Date.now()}::${Math.ceil(Math.random() * 9999999)}`;
            // Assign a user
            post.author = "arunoda";

            // Add the Post to the data store
            PostsList.push(post);

            // return the new post.
            return post;
          }
        }
      })
    });

### 9. Executing GraphQL Queries

自己动手实现服务器端，使用 graphql 库。

#### 1. setting up

新建 nodejs 工程，安装 babel-cli (含 babel-node)，babel-preset-es2015, graphql。剩下步骤：

1. 导入 graphql 库
1. 定义 schema
1. 使用 `graphql()` 方法执行查询
1. 在查询中使用变量

最重要的就是这个 `graphql()` 方法: `function graphql(schema, requestString, rootValue, contextValue, variableValues, operationName)`。

> The graphql npm module is isomorphic. So you can use it with both the client and the server. 

(所以 isomorphic 的意思是指可以同时在客户端和服务器端运行，让我想起了 meteor。)

- express-graphql - This project allows you to create a GraphQL server with express.
- graffiti - This project allows you to use an existing mongoose schema with GraphQL.

### 10. Using A Real Data Source

#### 1. setting up

使用了 express-graphql 库和 mongodb。

#### 2. async / promises

操作数据库必须是异步的，使用 promised-mongo 库。

#### 3. implementing a mutation

使用 promised-mongo 操作 mongo 数据库。

    const mongo = require('promised-mongo');
    // You can use any MONGO_URL here, whether it's locally or on cloud.
    const db = mongo('mongodb://localhost/mydb');
    const authorsCollection = db.collection('authors');

    const Mutation = new GraphQLObjectType({
      name: "Mutations",
      fields: {
        createAuthor: {
          type: Author,
          args: {
            _id: {type: new GraphQLNonNull(GraphQLString)},
            name: {type: new GraphQLNonNull(GraphQLString)},
            twitterHandle: {type: GraphQLString}
          },
          resolve: function(rootValue, args) {
            let author = Object.assign({}, args);
            return authorsCollection.insert(author)
              .then(_ => author);
          }
        }
      }
    });

#### 4. implementing the root query field

    return authorsCollection.find().toArray();

#### 5. field filtering

在 MongoDB level 做 field filter。其实没什么 意义，因为 GraphQL 自身会做一层的 filter。而且发现即使在 mongo db 这一层做了 filter，实际却没有生效，不知道为什么

### 11. More on GraphQL

看完了，大致明白了 GraphQL 的作用。剩下一个疑问：客户端到底是怎么调用 API ?? (React 客户端可以用 Relay，那么其它语言呢?)
