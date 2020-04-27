import {
  Query,
  Resolver,
  Mutation,
  Ctx,
  Arg,
  InputType,
  Field,
} from "type-graphql";
import { SavedCategoriesEntity } from "../../entity/SavedCategories";
import { MyContext } from "../../MyContext";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";

@InputType()
class SavedCategoriesInput {
  @Field({ nullable: true })
  name?: string;
  @Field({ nullable: true })
  memo?: string;
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
        relations: ["category", "subCategory"],
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

  @Mutation(() => Boolean || null)
  async createSavedCategory(
    @Arg("data") data: SavedCategoriesInput,
    @Ctx() context: MyContext
  ) {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const res = await SavedCategoriesEntity.create({
        userId,
        ...data,
      }).save();
      console.log("CTR 69: res ", res);
      return true;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => Boolean)
  async deleteSavedCategory(@Arg("id") id: string, @Ctx() context: MyContext) {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return false;
    }

    try {
      await SavedCategoriesEntity.delete(id);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
