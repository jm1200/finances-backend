import { SubCategoryEntity } from "../../entity/SubCategory";

export const createSubCategory = async (
  userId: number,
  name: string,
  categoryId: number
) => {
  try {
    await SubCategoryEntity.create({
      userId,
      name,
      categoryId,
    }).save();
  } catch (err) {
    console.log("Could not create category", err);
  }
};
