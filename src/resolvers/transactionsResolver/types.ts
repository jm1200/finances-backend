import { ObjectType, Field, Float } from "type-graphql";
export interface Year {
  year: string;
  amount: number;
}

export interface IYears {
  [key: string]: Year;
}
export interface CategoryRowSummary {
  categoryName: string;
  subCategoryName: string;
  categoryId: string;
  subCategoryLength: number;
  subCategories: ISubCategoryRowSummary;
  years: IYears;
}

export interface ICategoryRowSummary {
  [key: string]: CategoryRowSummary;
}

export interface SubCategoryRowSummary {
  subCategoryName: string;
  subCategoryId: string;
  years: IYears;
}

export interface ISubCategoryRowSummary {
  [key: string]: SubCategoryRowSummary;
}

@ObjectType()
export class DisplayYear {
  @Field()
  year: string;
  @Field(() => Float)
  amount: number;
}
@ObjectType()
export class IDisplaySubCategoryRowSummary {
  @Field()
  subCategoryName: string;
  @Field()
  subCategoryId: string;
  @Field(() => [DisplayYear])
  years: DisplayYear[];
}

@ObjectType()
export class IDisplayDataSummary {
  @Field()
  categoryName: string;
  @Field()
  subCategoryName: string;
  @Field()
  categoryId: string;
  @Field()
  subCategoryLength: number;
  @Field(() => [DisplayYear])
  years: DisplayYear[];
  @Field(() => [IDisplaySubCategoryRowSummary])
  subCategories: IDisplaySubCategoryRowSummary[];
}
