Types::MutationType = GraphQL::ObjectType.define do
  name "Mutation"

  # TODO: Add Mutations as fields
  field :allLinks, !types[Types::LinkType] do
    resolve -> (obj, args, ctx) { Link.all }
  end
end
