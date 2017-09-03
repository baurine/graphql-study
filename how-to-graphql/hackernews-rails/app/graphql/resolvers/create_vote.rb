class Resolvers::CreateVote < GraphQL::Function
  argument :linkId, !types.ID

  type Types::VoteType

  def call(_obj, args, _ctx)
    Vote.create!(
      link: Link.find(args[:linkId]),
      user: _ctx[:current_user]
    )
  end
end
