import { CategoryEntity } from "../../entity/Category";

export const createCategory = async (
  userId: number,
  name: string
): Promise<number | null> => {
  try {
    const newCategory = await CategoryEntity.create({ userId, name }).save();
    return newCategory.id;
  } catch (err) {
    console.log("Could not create category", err);
    return null;
  }
};
