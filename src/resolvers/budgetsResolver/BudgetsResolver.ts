import { Query, Resolver, Mutation, Ctx, Arg } from "type-graphql";
import { MyContext } from "../../MyContext";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { BudgetsEntity } from "../../entity/Budgets";

@Resolver()
export class BudgetsResolver {
  @Query(() => [BudgetsEntity] || null)
  async getUserBudgets(
    @Ctx() context: MyContext
  ): Promise<BudgetsEntity[] | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const budgets = await BudgetsEntity.find({
        where: { userId },
      });

      if (budgets) {
        return budgets;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => BudgetsEntity || null)
  async createBudget(
    @Arg("name") name: string,
    @Arg("values") values: string,
    @Ctx() context: MyContext
  ): Promise<BudgetsEntity | null> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return null;
    }

    try {
      const res = await BudgetsEntity.create({
        userId,
        name,
        values,
      }).save();
      return res;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => Boolean)
  async deleteBudget(
    //@Arg("transactionId") transactionId: string,
    @Arg("budgetId") budgetId: string,
    @Ctx() context: MyContext
  ) {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);

    if (!userId) {
      return false;
    }

    try {
      await BudgetsEntity.delete(budgetId);

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
