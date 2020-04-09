import {
  Resolver,
  Query,
  Mutation,
  Arg,
  UseMiddleware,
  Int,
  Ctx,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
import { UserEntity } from "../../entity/User";

@Resolver()
export class TransactionsResolver extends BaseEntity {
  @Query(() => UserEntity)
  @UseMiddleware(isAuth)
  async getAllUserTransactions(
    @Ctx() context: MyContext
  ): Promise<UserEntity | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return null;
    }
    try {
      const user = await UserEntity.findOne(userId!, {
        relations: ["transactions"],
      });
      console.log("User data: ", user);
      if (user) {
        return user;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  // @Mutation(() => UserSettings, { nullable: true })
  // @UseMiddleware(isAuth)
  // async updateTheme(
  //   @Arg("theme") theme: string,
  //   @Arg("userId") userId: number
  // ): Promise<UserSettings | null> {
  //   try {
  //     await UserSettings.update(userId, { theme });
  //     const userSettings = await UserSettings.findOne(userId);
  //     if (userSettings) {
  //       return userSettings;
  //     }
  //   } catch (err) {
  //     console.log("could not update user settings");
  //   }
  //   return null;
  // }
}
