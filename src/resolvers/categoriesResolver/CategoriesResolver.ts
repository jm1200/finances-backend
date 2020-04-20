import { Query, Resolver, Mutation, Ctx, Arg, Int } from "type-graphql";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../MyContext";
import { CategoryEntity } from "../../entity/Category";
import { createCategory } from "../utils/createCategoryEntity";
import { createSubCategory } from "../utils/createSubCategoryEntity";
import { SubCategoryEntity } from "../../entity/SubCategory";

@Resolver()
export class CategoriesResolver {
  @Query(() => [CategoryEntity] || null)
  async getUserCategories(
    @Ctx() context: MyContext
  ): Promise<CategoryEntity[] | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const categories = await CategoryEntity.find({
        where: { userId },
        relations: ["transactions", "subCategories"],
      });
      if (categories) {
        return categories;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query(() => CategoryEntity)
  async getCategory(
    @Arg("categoryId", () => Int!) categoryId: number,
    @Ctx() context: MyContext
  ): Promise<CategoryEntity | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return false;
    }

    try {
      const category = await CategoryEntity.findOne({
        where: { userId, id: categoryId },
        relations: ["transactions"],
      });
      if (category) {
        return category;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async addCategory(
    @Arg("name") name: string,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: number = getUserIdFromHeader(
      context.req.headers["authorization"]
    ) as number;

    if (!userId) {
      return false;
    }
    try {
      await createCategory(userId, name);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async updateCategory(
    @Arg("name") name: string,
    @Arg("categoryId", () => Int) categoryId: number,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: number = getUserIdFromHeader(
      context.req.headers["authorization"]
    ) as number;

    if (!userId) {
      return false;
    }
    try {
      const categoryToUpdate = await CategoryEntity.update(categoryId, {
        name,
      });
      if (!categoryToUpdate) {
        console.log("Could not find category to update");
        return false;
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async deleteCategory(
    @Arg("categoryId", () => Int) categoryId: number,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: number = getUserIdFromHeader(
      context.req.headers["authorization"]
    ) as number;

    if (!userId) {
      return false;
    }
    try {
      await CategoryEntity.delete(categoryId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async addSubCategory(
    @Arg("name") name: string,
    @Arg("categoryId", () => Int) categoryId: number,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: number = getUserIdFromHeader(
      context.req.headers["authorization"]
    ) as number;

    if (!userId) {
      return false;
    }

    try {
      await createSubCategory(userId, name, categoryId);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async deleteSubCategory(
    @Arg("subCategoryId", () => Int) subCategoryId: number,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: number = getUserIdFromHeader(
      context.req.headers["authorization"]
    ) as number;

    if (!userId) {
      return false;
    }
    try {
      await SubCategoryEntity.delete(subCategoryId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
