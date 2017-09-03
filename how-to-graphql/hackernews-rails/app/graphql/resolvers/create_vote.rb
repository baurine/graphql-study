class Resolvers::CreateVote < GraphQL::Function
  argument :linkId, !types.ID

  type Types::VoteType

  def call(_obj, args, _ctx)
    if _ctx[:current_user].nil?
      return GraphQL::ExecutionError.new('Please login in first')
    end

    Vote.find_or_create_by!(
      link: Link.find(args[:linkId]),
      user: _ctx[:current_user]
    )
  end
end
