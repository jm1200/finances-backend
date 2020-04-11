import { Query, Resolver, Mutation, Ctx, Arg, Int } from "type-graphql";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../MyContext";
import { CategoryEntity } from "../../entity/Category";
import { UserEntity } from "../../entity/User";

@Resolver()
export class CategoriesResolver {
  @Query(() => UserEntity || null)
  async getUserCategories(
    @Ctx() context: MyContext
  ): Promise<UserEntity | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const user = await UserEntity.findOne(userId, {
        relations: ["categories"],
      });
      if (user) {
        console.log(user);
        return user;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
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
      await CategoryEntity.create({
        name,
        userId,
      }).save();
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
}
