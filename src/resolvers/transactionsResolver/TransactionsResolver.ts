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
import { TransactionEntity } from "../../entity/Transaction";

@Resolver()
export class TransactionsResolver extends BaseEntity {
  @Query(() => [TransactionEntity])
  @UseMiddleware(isAuth)
  getAllUserTransactionsForUser(
    @Arg("allTransactions", () => Int) userId: number
  ) {
    //return TransactionEntity.find({where: userId});
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
