# 补充

### Rails 中 Database table / ActiveRecord / ObjectType 关系

初学 GraphQL，很容易误以为 Schema 中定义的各种 Type 就是 ActiveRecord，实际并不是。

    DB Table <--> ActiveRecord <--> GraphQL::ObjectType

真实的情况是，GraphQL::ObjectType 可以和 ActiveRecord 完全没有关系，但实际应用中，每个 ActiveRecord 一般都会有一个对应的 ObjectType，ObjectType 从 ActiveRecord 实例中得到值。

(补充示例代码)

至于 ActiveRecord 和 DB Table，前者的属性和后者对应的列，并不一定是相同的类型。 比如在 ActiveRecord 用 enum 声明的属性，在 ActiveRecord 此属性的值的类型是 String，但在 table 中对应的列的类型是 Integer。

可以理解成 ActiveRecord 的属性和 DB Table 的列之间有一个映射关系，大部分时候类型是一样的。

例子：

    class User < ApplicationRecord
      enum position: { manager: 0, leader: 1, employee: 2 }
    end

    > user = User.new
    > user.position = 'manager'
    > user.save

    > user.position.class
    String

当对 user.position 赋值 'manager'，存入数据库中时，ActiveRecord 会自动转换成相应的 Integer 值。当对 user.position 赋值非法的字符串时，ActiveRecord 这一层就会提示错误。

enum 可以看作是一种 vaildates。

一篇关于 rails 中 enum 的一些总结：[关于在 Rails Model 中使用 Enum (枚举) 的若干总结](https://ruby-china.org/topics/28654)
