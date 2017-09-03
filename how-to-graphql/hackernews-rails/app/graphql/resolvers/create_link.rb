class Resolvers::CreateLink < GraphQL::Function
  # arguments passed as "args"
  argument :url, !types.String
  argument :description, !types.String

  # return type from the mutation
  type Types::LinkType

  def call(obj, args, ctx)
    Link.create!(
      description: args[:description],
      url: args[:url],
      user: ctx[:current_user]
    )
  rescue ActiveRecord::RecordInvalid => e
    # this would catch all validation errors and translate them to GraphQL::ExecutionError
    GraphQL::ExecutionError.new("Invalid input: #{e.record.errors.full_messages.join(', ')}")
  end
end
