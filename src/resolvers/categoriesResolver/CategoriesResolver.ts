import { Query, Resolver, Mutation, Ctx, Arg } from "type-graphql";
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
    return false;
  }
}
