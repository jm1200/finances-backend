import {
  Query,
  Resolver,
  Mutation,
  Ctx,
  Arg,
  InputType,
  Field,
  Float,
} from "type-graphql";
import { SavedCategoriesEntity } from "../../entity/SavedCategories";
import { MyContext } from "../../MyContext";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { TransactionEntity } from "../../entity/Transaction";

@InputType()
class SavedCategoriesInput {
  @Field({ nullable: true })
  name?: string;
  @Field({ nullable: true })
  memo?: string;
  @Field(() => Float, { nullable: true })
  amount?: number;
  @Field()
  categoryId: string;
  @Field()
  subCategoryId: string;
}

@Resolver()
export class SavedCategoriesResolver {
  @Query(() => [SavedCategoriesEntity] || null)
  async getUserSavedCategories(
    @Ctx() context: MyContext
  ): Promise<SavedCategoriesEntity[] | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const savedCategories = await SavedCategoriesEntity.find({
        where: { userId },
        relations: ["category", "subCategory", "transactions"],
      });

      if (savedCategories) {
        return savedCategories;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => SavedCategoriesEntity || null)
  async createSavedCategory(
    @Arg("data") data: SavedCategoriesInput,
    @Ctx() context: MyContext
  ): Promise<SavedCategoriesEntity | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const res = await SavedCategoriesEntity.create({
        userId,
        ...data,
      }).save();
      return res;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => Boolean)
  async deleteSavedCategory(
    //@Arg("transactionId") transactionId: string,
    @Arg("savedCategoryId") savedCategoryId: string,
    @Ctx() context: MyContext
  ) {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return false;
    }

    try {
      const savedCategory = await SavedCategoriesEntity.findOne(
        savedCategoryId,
        {
          relations: ["transactions"],
        }
      );
      console.log("CTR 93", savedCategory);
      if (savedCategory!.transactions.length > 0) {
        savedCategory?.transactions.forEach(async (transaction) => {
          await TransactionEntity.update(transaction.id, {
            savedCategoryId: null,
          });
        });
      }
      await SavedCategoriesEntity.delete(savedCategoryId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
