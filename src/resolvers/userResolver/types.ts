import { Length, IsEmail } from "class-validator";
import { Field, InputType, ObjectType } from "type-graphql";
import { User } from "../../entity/User";
import { UserSettings } from "../../entity/UserSettings";

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
  @Field(() => User)
  user: User;
  @Field(() => UserSettings)
  userSettings: UserSettings;
}
@ObjectType()
export class MeResponse {
  @Field(() => User, { nullable: true })
  user: User | null;
  @Field(() => UserSettings, { nullable: true })
  userSettings: UserSettings | null;
}
