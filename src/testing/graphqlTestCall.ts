import { graphql } from "graphql";
import { buildSchema } from "type-graphql";
import { FileUploadResolver } from "../resolvers/fileUploadResolver/FileUploadResolver";
import { UserSettingsResolver } from "../resolvers/userSettingsResolver/UserSettingsResolver";
import { UserResolver } from "../resolvers/userResolver/UserResolver";
import { TransactionsResolver } from "../resolvers/transactionsResolver/TransactionsResolver";
import { CategoriesResolver } from "../resolvers/categoriesResolver/CategoriesResolver";

export const graphqlTestCall = async (
  query: any,
  variables?: any,
  accessToken?: string
) => {
  const schema = await buildSchema({
    resolvers: [
      UserResolver,
      FileUploadResolver,
      UserSettingsResolver,
      TransactionsResolver,
      CategoriesResolver,
    ],
  });
  return graphql(
    schema,
    query,
    undefined,

    {
      req: {
        headers: {
          authorization: `bearer ${accessToken}`,
        },
      },
      res: {
        cookie: () => {},
      },
    },
    variables
  );
};
