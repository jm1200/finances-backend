import {
  Resolver,
  Query,
  Mutation,
  Arg,
  UseMiddleware,
  Int,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../../isAuth";
import { UserSettingsEntity } from "../../entity/UserSettings";

@Resolver()
export class UserSettingsResolver extends BaseEntity {
  //might not need this query anymore.
  @Query(() => UserSettingsEntity)
  @UseMiddleware(isAuth)
  getUserSettings(@Arg("userId", () => Int) userId: number) {
    return UserSettingsEntity.findOne(userId);
  }

  @Mutation(() => UserSettingsEntity, { nullable: true })
  @UseMiddleware(isAuth)
  async updateTheme(
    @Arg("theme") theme: string,
    @Arg("id") id: string
  ): Promise<UserSettingsEntity | null> {
    try {
      await UserSettingsEntity.update(id, { theme });
      const userSettings = await UserSettingsEntity.findOne(id);
      if (userSettings) {
        return userSettings;
      }
    } catch (err) {
      console.log("could not update user settings");
    }
    return null;
  }
}
//TODO figure out how to update userSettings with relations.
