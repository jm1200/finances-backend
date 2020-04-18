import {
  Resolver,
  UseMiddleware,
  Ctx,
  Arg,
  InputType,
  Field,
  Mutation,
  Int,
  Query,
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
import { TransactionEntity } from "../../entity/Transaction";
import { CategoryEntity } from "../../entity/Category";
import { UserEntity } from "../../entity/User";

@InputType()
export class updateTransactionInput {
  @Field(() => [String])
  ids: string[];
  @Field(() => Int!)
  categoryId: number;
  @Field({ nullable: true })
  subCategoryName: string;
}

@Resolver()
export class TransactionsResolver extends BaseEntity {
  @Query(() => [TransactionEntity] || Boolean)
  async getAllTransactions(
    @Ctx() context: MyContext
  ): Promise<TransactionEntity[] | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      const user = await UserEntity.findOne(userId, {
        relations: ["transactions"],
      });
      if (user && user.transactions) {
        const data = user.transactions.slice(0, 5);
        return data;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
    return false;
  }
  @Query(() => TransactionEntity || Boolean)
  async getTransactionsById(
    @Arg("id") id: string,
    @Ctx() context: MyContext
  ): Promise<TransactionEntity | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      const transaction = await TransactionEntity.findOne(id);
      if (transaction) {
        return transaction;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateCategoriesInTransaction(
    @Arg("data")
    { ids, categoryId, subCategoryName }: updateTransactionInput,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }

    try {
      const category = await CategoryEntity.findOne(categoryId);

      if (!category) {
        return false;
      }
      const categoryName = category.name;
      ids.forEach(async (id) => {
        try {
          await TransactionEntity.update(id, {
            categoryId,
            categoryName,
            subCategoryName,
          });
          return true;
        } catch (err) {
          console.log("error inserting id: ", id);
          return false;
        }
      });

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
