import { Query, Resolver, Mutation, Ctx, Arg, Int } from "type-graphql";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../MyContext";
import { CategoryEntity } from "../../entity/Category";
import { createCategory } from "../utils/createCategoryEntity";
import { createSubCategory } from "../utils/createSubCategoryEntity";
import { SubCategoryEntity } from "../../entity/SubCategory";
import { parseTransactionsForCashFlowAnalysis } from "./parseTransactionsForCashFlowAnalysis";
import { IDisplayData } from "./types";

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
        relations: ["subCategories"],
      });

      if (categories) {
        return categories.sort((a, b) => {
          if (b.name > a.name) return -1;
          if (b.name < a.name) return 1;
          return 0;
        });
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query(() => [SubCategoryEntity] || null)
  async getOnlyUserSubCategories(
    @Ctx() context: MyContext
  ): Promise<SubCategoryEntity[] | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const subCategories = await SubCategoryEntity.find({
        where: { userId },
        relations: ["category", "transactions"],
      });

      if (subCategories) {
        return subCategories;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query(() => [IDisplayData] || null)
  async getUserSubCategories(
    @Arg("selectedYear", () => Int) selectedYear: number,
    @Arg("filteredCategory") filteredCategory: string,
    @Ctx() context: MyContext
  ): Promise<IDisplayData[] | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const subCategories = await SubCategoryEntity.find({
        where: { userId },
        relations: ["category", "transactions"],
      });

      if (subCategories) {
        const displayData = parseTransactionsForCashFlowAnalysis(
          subCategories,
          selectedYear,
          filteredCategory
        );

        return displayData;
        // .sort((a, b) => {
        //   if (b.name > a.name) return -1;
        //   if (b.name < a.name) return 1;
        //   return 0;
        // });
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Query(() => CategoryEntity)
  async getCategorybyId(
    @Arg("categoryId") categoryId: string,
    @Ctx() context: MyContext
  ): Promise<CategoryEntity | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return false;
    }

    try {
      CategoryEntity.findAndCount({});
      const category = await CategoryEntity.findOne({
        where: { userId, id: categoryId },
        relations: ["transactions", "subCategories"],
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
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

    if (!userId) {
      return false;
    }
    try {
      let newCategoryId = await createCategory(userId, name);
      if (!newCategoryId) return false;
      await createSubCategory(userId, "uncategorized", newCategoryId);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async updateCategory(
    @Arg("name") name: string,
    @Arg("categoryId") categoryId: string,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

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
    @Arg("categoryId") categoryId: string,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

    if (!userId) {
      return false;
    }
    try {
      let subCategories = await SubCategoryEntity.find({
        where: { categoryId },
      });
      subCategories.forEach(async (subCategory) => {
        await SubCategoryEntity.delete(subCategory.id);
      });
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
    @Arg("categoryId") categoryId: string,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

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
    @Arg("subCategoryId") subCategoryId: string,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

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
