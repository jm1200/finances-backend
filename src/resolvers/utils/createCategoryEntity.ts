import { CategoryEntity } from "../../entity/Category";

export const createCategory = async (
  userId: string,
  name: string
): Promise<string | null> => {
  try {
    const newCategory = await CategoryEntity.create({ userId, name }).save();

    return newCategory.id;
  } catch (err) {
    console.log("Could not create category", err);
    return null;
  }
};
