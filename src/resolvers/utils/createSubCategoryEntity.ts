import { SubCategoryEntity } from "../../entity/SubCategory";

export const createSubCategory = async (
  userId: string,
  name: string,
  categoryId: string
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
