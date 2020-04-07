import { Length, IsEmail } from "class-validator";
import { Field, InputType, ObjectType } from "type-graphql";
import { UserEntity } from "../../entity/User";

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(3, 20, { message: "test message" })
  password: string;
}
@ObjectType()
export class LoginResponse {
  @Field()
  accessToken: string;
  //must explicitly define type. User not primitive
  @Field(() => UserEntity)
  user: UserEntity;
}
@ObjectType()
export class MeResponse {
  @Field(() => UserEntity, { nullable: true })
  user: UserEntity | null;
}
