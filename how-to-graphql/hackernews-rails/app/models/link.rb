class Link < ApplicationRecord
  validates :url, presence: true, length: { minimum: 5 }
  validates :description, presence: true, length: { minimum: 5 }
  # https://apidock.com/rails/ActiveModel/Validations/ClassMethods/validates_format_of
  validates_format_of :url, :with => URI.regexp(['http'])

  belongs_to :user
  has_many :votes
end
