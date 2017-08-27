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

**Preparing the React components**

Link component 显示一条链接，LinkList 显示一个链接数组，显示的数据先暂时 mock，我们接下来要做的就是用 apollo 来从服务器获取真实数据。

**Query with Apollo Client**

两种方式，一种是直接在 component 中用 `client.query()` 方法进行 GraphQL API 请求：

    client.query({
      query: gql`
        query AllLinks {
          allLinks {
            id
          }
        }
      `
    })
    .then(response => console.log(response.data.allLinks))

另一种方式是像 Redux 那样，使用高阶组件，将 GraphQL 的请求封装在高阶组件中，获得的值通过 props 传给包装的纯显示组件。

    const ALL_LINKS_QUERY = gql`
      query AllLinksQuery {
        allLinks {
          id
          createdAt
          url
          description
        }
      }
    `

    export default graphql(ALL_LINKS_QUERY, { name: 'allLinksQuery' }) (LinkList)

#### Mutations: Creating Links

**Preparing the React components**

实现一个 CreateLink 的 component，用来提交链接。

**Writing the Mutation**

和 query 一样，用一个高阶组件包装上面实现的纯显示的 CreateLink 组件：

    // 1
    const CREATE_LINK_MUTATION = gql`
      # 2
      mutation CreateLinkMutation($description: String!, $url: String!) {
        createLink(
          description: $description,
          url: $url,
        ) {
          id
          createdAt
          url
          description
        }
      }
    `

    // 3
    export default graphql(CREATE_LINK_MUTATION, { name: 'createLinkMutation' })(CreateLink)

发送 mutation 请求：

    _createLink = async () => {
      const { description, url } = this.state
      await this.props.createLinkMutation({
        variables: {
          description,
          url
        }
      })
    }

好奇，如果一个组件既有 query，又有 mutation，该怎么包装呢?

#### Routing

用 react-router 实现路由。主要是 react-router 的用法，细节略。

react-router 的主要用法。

`<Link>` 渲染一个链接：

    <Link to='/create' className='ml1 no-underline black'>submit</Link>

`<Route>` 指定一个链接和组件的对应关系，所有 `<Route>` 包裹在 `<Switch>` 中：

    <Switch>
      <Route exact path='/' component={LinkList}/>
      <Route exact path='/create' component={CreateLink}/>
    </Switch>

`<BrowserRouter>` 包裹整个 `<App>`，这样，每个组件都能从 props 得到 histroy 对象了：

    ReactDOM.render(
      <BrowserRouter>
        <ApolloProvider client={client}>
          <App/>
        </ApolloProvider>
      </BrowserRouter>, document.getElementById('root')
    )

主动触发链接跳转：

    this.props.histroy.push('/')

#### Authentication

实现登录和注册。主要逻辑是：

1. 在 graphcool console 页面 enable 通过 email / password 登录，这样，graphcool 就会给 User 的数据类型加上 email 和 password 属性。并且增加 2 个新的 schema，`createUser()` 用来注册，`signinUser()` 用来登录。
1. 实现 Login component。
1. 实现登录注册的 mutation。这里有一个很有用的用法，我们希望注册成功后能够自动登录，因此把 `createUser()` 和 `signinUser()` 写在同一个 mutation 中，就可以用一个请求实现注册和登录，nice!

        const CREATE_USER_MUTATION = gql`
          mutation CreateUserMutation($name: String!, $email: String!, $password: String!) {
            createUser(
              name: $name,
              authProvider: {
                email: {
                  email: $email,
                  password: $password
                }
              }
            ) {
              id
            }

            signinUser(email: {
              email: $email,
              password: $password
            }) {
              token
              user {
                id
              }
            }
          }
        `

        const SIGNIN_USER_MUTATION = gql`
          mutation SigninUserMutation($email: String!, $password: String!) {
            signinUser(email: {
              email: $email,
              password: $password
            }) {
              token
              user {
                id
              }
            }
          }
        `

        export default compose(
          graphql(CREATE_USER_MUTATION, { name: 'createUserMutation' }),
          graphql(SIGNIN_USER_MUTATION, { name: 'signinUserMutation' })
        )(Login)

1. 在点击登录或注册按钮后，发送登录或注册的请求，并把返回的 user id 和 token 保存到 localStorage 中。

        _confirm = async () => {
          const { name, email, password } = this.state
          if (this.state.login) {
            const result = await this.props.signinUserMutation({
              variables: {
                email,
                password
              }
            })
            const id = result.data.signinUser.user.id
            const token = result.data.signinUser.token
            this._saveUserData(id, token)
          } else {
            const result = await this.props.createUserMutation({
              variables: {
                name,
                email,
                password
              }
            })
            const id = result.data.signinUser.user.id
            const token = result.data.signinUser.token
            this._saveUserData(id, token)
          }
          this.props.history.push(`/`)
        }

1. 更新 createLink mutation，增加 postedById 参数，用来记录发布链接的用户。(但是这种机制好吗? 不应该是在每个请求中带上 token，然后由服务端根据 token 来查找到相应的用户吗?)

1. 更新 ApolloClient 的配置，为每个请求的 header 增加 authorization 字段。(这才是正确的姿势嘛，但好像服务器目前并没有处理 header 的逻辑，另外，applyMiddelware 是从哪里来的，也没有见到有 import 的地方?)

        networkInterface.use([{
          applyMiddleware(req, next) {
            if (!req.options.headers) {
              req.options.headers = {}
            }
            const token = localStorage.getItem(GC_AUTH_TOKEN)
            req.options.headers.authorization = token ? `Bearer ${token}` : null
            next()
          }
        }])

#### More Mutations and Updating the Store

第一部分 More Mutations，是指实现投票功能，步骤和上一小节差不多：

1. 更新 Link component，显示投票的按钮，以及投票人，投票数量等更多信息。
1. 更新 schema，增加 Vote 数据类型，把它和 User、Link 关联，并给 User 增加 votes 属性，给 Link 增加 votes 属性，votes 属性都是 Vote 数组。
1. 更新 allLinks query，在返回的属性中增加 votes 字段。
1. 在 Link component 中点击投票按钮后调用 createVote mutation。

第二部分内容才是让人有点兴奋的，更新 apollo 的缓存，不过实际看下来，其实内部就是一个跟 redux 差不多的东西。

前面我们已经实现了很多网络请求，但请求返回后我们却并没有更新 UI，导致需要重新手动刷新后才能看到结果。一般项目中我们会用 redux 来管理数据，当请求返回后，我们把结果写到 redux 的 store 中 (实际是由 reducer 来完成的)，然后数据的变化会重新刷新 UI，这样我们就能及时看到结果了。Apollo 也是这么做的! 我觉得它其实是封装了 redux 的逻辑。

此小节中举了两个例子，投票和发布链接，我们这里只看看后者的示例代码：

    await this.props.createLinkMutation({
      variables: {
        description,
        url,
        postedById
      },
      update: (store, { data: { createLink } }) => {
        const data = store.readQuery({ query: ALL_LINKS_QUERY })
        data.allLinks.splice(0,0,createLink)
        store.writeQuery({
          query: ALL_LINKS_QUERY,
          data
        })
      }
    })

网络请求返回之后，Apollo 会执行我们定义的 update 函数。在这个函数里分三步走：

1. 通过 `store.readQuery()` 读出 store 中原来的数据。
1. 将新得到的数据加到原来的数据里。
1. 通过 `store.writeQuery()` 将新数据更新到 store 中，store 内部会自动重新刷新 UI，这样我们就能及时看到结果了。

跟 redux 的原理是不是几乎一样!

#### Filtering: Searching the List of Links

本小节实现了支持搜索的 Search component。有两个新的知识点：

1. apollo 是如何支持搜索的
1. 另一种让纯显示 component 使用 apollo api 的方法

先来看 apollo 是如何支持搜索的，很简单，在 allLinks query 中使用 filter 参数：

    const ALL_LINKS_SEARCH_QUERY = gql`
      query AllLinksSearchQuery($searchText: String!) {
        allLinks(filter: {
          OR: [{
            url_contains: $searchText
          }, {
            description_contains: $searchText
          }]
        }) {
          id
          ...
        }
      }
    `

实际你到 graphcool 的 playground 上看的话，allLinks query 是支持很多可选参数的，除了 fitler，还有用来支持排序的 orderBy 等。

    allLinks(filter: LinkFilter, orderBy: LinkOrderBy, skip: Int, after: String, before: String, first: Int, last: Int): [Link!]!

前面说到，为了让纯显示的 component 能够使用 apollo 的 api，我们要用一个 apollo 的高阶组件包裹它。这一小节讲了另一种方法，不再用高阶组件包裹，而是用 `withApollo()` 方法包裹，实际内部是把 apollo client 实例通过 props 传给了这个 component，然后这个 component 内部就可以随时通过 `this.props.client.xxx` 来调用 apollo 的各种方法了，比如此例中发送搜索请求的示例：

    _executeSearch = async () => {
      const { searchText } = this.state
      const result = await this.props.client.query({
        query: ALL_LINKS_SEARCH_QUERY,
        variables: { searchText }
      })
      const links = result.data.allLinks
      this.setState({ links })
    }

另外，此教程中大量使用了 async / await，用起来确实很爽很方便啊。

#### Realtime Updates with GraphQL Subscriptions

使用 apollo 的订阅功能来实现实时获取服务器数据的变化和更新 UI。太赞了!

这个功能正如之前所料，所有 WebSocket 来实现，因此要引入 subscriptions-transport-ws lib，并修改 apollo client 的设置。

实现订阅的示例代码如下所示，很好理解，暂时不做深入研究：

    _subscribeToNewVotes = () => {
      this.props.allLinksQuery.subscribeToMore({
        document: gql`
          subscription {
            Vote(filter: {
              mutation_in: [CREATED]
            }) {
              node {
                id
                link {
                  id
                  url
                  description
                  createdAt
                  postedBy {
                    id
                    name
                  }
                  votes {
                    id
                    user {
                      id
                    }
                  }
                }
                user {
                  id
                }
              }
            }
          }
        `,
        updateQuery: (previous, { subscriptionData }) => {
          const votedLinkIndex = previous.allLinks.findIndex(link => link.id === subscriptionData.data.Vote.node.link.id)
          const link = subscriptionData.data.Vote.node.link
          const newAllLinks = previous.allLinks.slice()
          newAllLinks[votedLinkIndex] = link
          const result = {
            ...previous,
            allLinks: newAllLinks
          }
          return result
        }
      })
    }

#### Pagination

分页，使用 allLinks query 中的 first, skip, orderBy 参数。

    export const ALL_LINKS_QUERY = gql`
      query AllLinksQuery($first: Int, $skip: Int, $orderBy: LinkOrderBy) {
        allLinks(first: $first, skip: $skip, orderBy: $orderBy) {
          id
          ...

这一小节没有很仔细地看，大致了解，有空再仔细看。


