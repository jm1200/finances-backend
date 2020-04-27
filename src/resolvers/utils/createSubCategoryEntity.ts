import { SubCategoryEntity } from "../../entity/SubCategory";

export const createSubCategory = async (
  userId: string,
  name: string,
  categoryId: string
) => {
  try {
    const newSubCategory = await SubCategoryEntity.create({
      userId,
      name,
      categoryId,
    });

    await newSubCategory.save();

    //console.log("CSCE 15, creating subcategory", res);
  } catch (err) {
    console.log("Could not create subCategory", err);
  }
};
