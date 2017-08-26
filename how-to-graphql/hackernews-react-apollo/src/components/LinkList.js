import React, { Component } from 'react'
import { graphql, gql } from 'react-apollo'
import Link from './Link'

class LinkList extends Component {
  render() {
    const { allLinksQuery } = this.props

    if (allLinksQuery && allLinksQuery.loading) {
      return <div>Loading...</div>
    }
    if (allLinksQuery && allLinksQuery.error) {
      return <div>Error</div>
    }

    const linksToRender = allLinksQuery.allLinks
    return (
      <div>
        {linksToRender.map(link => (
          <Link key={link.id} link={link}/>
        ))}
      </div>
    )
  }
}

const ALL_LINKS_QUERY = gql`
  # 2
  query AllLinksQuery {
    allLinks {
      id
      createdAt
      url
      description
    }
  }
`

// name is props key
export default graphql(ALL_LINKS_QUERY, { name: 'allLinksQuery' })(LinkList)
