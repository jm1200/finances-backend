import {
  Resolver,
  // Query,
  UseMiddleware,
  Ctx,
  Arg,
  InputType,
  Field,
  Mutation,
  Int,
  ObjectType,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
//import { UserEntity } from "../../entity/User";
//import { CategoryEntity } from "../../entity/Category";
import { TransactionEntity } from "../../entity/Transaction";
import { CategoryEntity } from "../../entity/Category";

@InputType()
export class updateTransactionInput {
  @Field({ nullable: true })
  subCategoryName: String;
  @Field({ nullable: true })
  categoryName: String;
}

@Resolver()
export class TransactionsResolver extends BaseEntity {
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateTransaction(
    @Arg("data") data: updateTransactionInput,
    @Arg("id", () => Int) id: number,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      const categoryRes = await CategoryEntity.findOne({
        where: { userId, name: data.categoryName },
      });
      console.log(categoryRes);

      // const res = await TransactionEntity.update(id, {
      //   subCategoryName: data.subCategoryName,
      //   categoryName: data.categoryName,
      // });
      // console.log("trans resolver 43", res);

      //if category does not exist create one
      //if category exists

      return true;
    } catch (err) {
      console.log(err);
      return false;
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
