import { ObjectType, Field } from "type-graphql";

export type Month =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";

export interface CategoryRow {
  categoryName: string;
  subCategoryName: string;
  categoryId: string;
  subCategoryLength: number;
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  May: number;
  Jun: number;
  Jul: number;
  Aug: number;
  Sep: number;
  Oct: number;
  Nov: number;
  Dec: number;
  low?: number;
  high?: number;
  avg?: number;
  med?: number;
  subCategories: ISubCategoryRow;
}

export interface ICategoryRow {
  [key: string]: CategoryRow;
}

export interface SubCategoryRow {
  subCategoryName: string;
  subCategoryId: string;
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  May: number;
  Jun: number;
  Jul: number;
  Aug: number;
  Sep: number;
  Oct: number;
  Nov: number;
  Dec: number;
  low?: number;
  high?: number;
  avg?: number;
  med?: number;
}

export interface ISubCategoryRow {
  [key: string]: SubCategoryRow;
}

@ObjectType()
export class IDisplaySubCategoryRow {
  @Field()
  subCategoryName: string;
  @Field()
  subCategoryId: string;
  @Field()
  Jan: string;
  @Field()
  Feb: string;
  @Field()
  Mar: string;
  @Field()
  Apr: string;
  @Field()
  May: string;
  @Field()
  Jun: string;
  @Field()
  Jul: string;
  @Field()
  Aug: string;
  @Field()
  Sep: string;
  @Field()
  Oct: string;
  @Field()
  Nov: string;
  @Field()
  Dec: string;
  @Field()
  low?: string;
  @Field()
  high?: string;
  @Field()
  avg?: string;
  @Field()
  med?: string;
}

@ObjectType()
export class IDisplayData {
  @Field()
  categoryName: string;
  @Field()
  subCategoryName: string;
  @Field()
  categoryId: string;
  @Field()
  subCategoryLength: number;
  @Field()
  Jan: string;
  @Field()
  Feb: string;
  @Field()
  Mar: string;
  @Field()
  Apr: string;
  @Field()
  May: string;
  @Field()
  Jun: string;
  @Field()
  Jul: string;
  @Field()
  Aug: string;
  @Field()
  Sep: string;
  @Field()
  Oct: string;
  @Field()
  Nov: string;
  @Field()
  Dec: string;
  @Field()
  low?: string;
  @Field()
  high?: string;
  @Field()
  avg?: string;
  @Field()
  med?: string;
  @Field(() => [IDisplaySubCategoryRow])
  subCategories: IDisplaySubCategoryRow[];
}
