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
        {linksToRender.map((link, index) => (
          <Link key={link.id} link={link} index={index}/>
        ))}
      </div>
    )
  }
}

const ALL_LINKS_QUERY = gql`
  query AllLinksQuery {
    allLinks {
      id
      createdAt
      url
      description
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
  }
`

// name is props key
export default graphql(ALL_LINKS_QUERY, { name: 'allLinksQuery' })(LinkList)
