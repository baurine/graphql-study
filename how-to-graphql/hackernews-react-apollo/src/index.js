import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'
import './styles/index.css'
import { BrowserRouter } from 'react-router-dom'
import { ApolloProvider, createNetworkInterface, ApolloClient } from 'react-apollo'
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws'
import { GC_AUTH_TOKEN } from './constants'

const networkInterface = createNetworkInterface({
  uri: 'https://api.graph.cool/simple/v1/cj6t4ldq40qde018487586tqg'
})

const wsClient = new SubscriptionClient(
  'wss://subscriptions.ap-northeast-1.graph.cool/v1/cj6t4ldq40qde018487586tqg', {
  reconnect: true,
  connectionParams: {
    authToken: localStorage.getItem(GC_AUTH_TOKEN),
  }
})

const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient
)

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

const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions
})

ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App/>
    </ApolloProvider>
  </BrowserRouter>, document.getElementById('root')
)

registerServiceWorker()
