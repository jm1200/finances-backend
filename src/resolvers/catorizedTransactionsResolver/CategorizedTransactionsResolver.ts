import {
  Query,
  Resolver,
  Mutation,
  Ctx,
  Arg,
  InputType,
  Field,
} from "type-graphql";
import { CategorizedTransactionsEntity } from "../../entity/CategorizedTransactions";
import { MyContext } from "../../MyContext";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";

@InputType()
class CategorizedTransactionInput {
  @Field()
  name: string;
  @Field()
  memo: string;
  @Field()
  categoryId: string;
  @Field()
  subCategoryId: string;
  @Field()
  userId: string;
}

@Resolver()
export class CategorizedTransactionsResolver {
  @Query(() => [CategorizedTransactionsEntity] || null)
  async getUserCategorizedTransactions(
    @Ctx() context: MyContext
  ): Promise<CategorizedTransactionsEntity[] | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const categorizedTransactions = await CategorizedTransactionsEntity.find({
        where: { userId },
        relations: ["category", "subCategory"],
      });

      if (categorizedTransactions) {
        return categorizedTransactions;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => Boolean)
  async createCategorizedTransaction(
    @Arg("data") data: CategorizedTransactionInput,
    @Ctx() context: MyContext
  ) {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const res = await CategorizedTransactionsEntity.create(data).save();
      console.log("CTR 69: res ", res);
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }
}
