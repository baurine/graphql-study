class Resolvers::CreateLink < GraphQL::Function
  # arguments passed as "args"
  argument :url, !types.String
  argument :description, !types.String

  # return type from the mutation
  type Types::LinkType

  def call(_obj, args, _cxt)
    Link.create!(
      url: args[:url],
      description: args[:description]
    )
  end
end
