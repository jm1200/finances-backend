import dotenv from "dotenv";
import "reflect-metadata";
import Express from "express";
import { ApolloServer } from "apollo-server-express";
import cors from "cors";
import { buildSchema } from "type-graphql";
import { verify } from "jsonwebtoken";
import { createConnection } from "typeorm";
import cookieParser from "cookie-parser";

import { UserEntity } from "./entity/User";
import { createAccessToken, createRefreshToken } from "./utils/auth";
import { sendRefreshToken } from "./utils/sendRefreshToken";
import { FileUploadResolver } from "./resolvers/fileUploadResolver/FileUploadResolver";
import { UserSettingsResolver } from "./resolvers/userSettingsResolver/UserSettingsResolver";
import { UserResolver } from "./resolvers/userResolver/UserResolver";
import { TransactionsResolver } from "./resolvers/transactionsResolver/TransactionsResolver";
import { CategoriesResolver } from "./resolvers/categoriesResolver/CategoriesResolver";
import { SavedCategoriesResolver } from "./resolvers/savedCategoriesResolver/CategorizedTransactionsResolver";
import { BudgetsResolver } from "./resolvers/budgetsResolver/BudgetsResolver";
import { GraphQLSchema } from "graphql";

dotenv.config();
(async () => {
  const app = Express();

  //gives req.cookies
  app.use(cookieParser());
  app.use(
    cors({
      credentials: true,
      origin: "http://localhost:3000",
    })
  );

  app.get("/", (_, res) => {
    res.send("hello");
  });

  //seperate route for refresh token. Not a graphql function. Our cookie only works on this route.
  app.post("/refresh_token", async (req, res) => {
    //request from frontend or POSTMAN has cookie(jid) in header.
    //this cookie is the access token.
    const token = req.cookies.jid;

    //if no cookie/token deny access
    if (!token) {
      return res.send({ ok: false, accessToken: "" });
    }

    //check if there is a valid refresh token, if not deny access
    let payload: any = null;
    try {
      payload = verify(token, process.env.REFRESH_TOKEN_SECRET!);
    } catch (err) {
      console.log(err);
      return res.send({ ok: false, accessToken: "" });
    }

    //a valid refresh token exists. There could only be a valid token
    //if the user has already had valid access token.
    //A refresh token payload={userId:id}

    const user = await UserEntity.findOne({ id: payload.userId });

    //if no user with that id, deny access
    if (!user) {
      return res.send({ ok: false, accessToken: "" });
    }

    //in the User Entity (database), each user has a token version that increments only
    //when an access token is sent ie. when the user logs in with password. if the TV in
    //the db does not equal the TV in the payload, deny access.
    if (user.tokenVersion !== payload.tokenVersion) {
      //token is invalid
      return res.send({ ok: false, accessToken: "" });
    }

    sendRefreshToken(res, createRefreshToken(user));

    return res.send({ ok: true, accessToken: createAccessToken(user) });
  });
  try {
    await createConnection();
  } catch (err) {
    console.log("error creating connection", err);
  }

  async function generateSchema(): Promise<GraphQLSchema> {
    try {
      const schema = await buildSchema({
        resolvers: [
          UserResolver,
          FileUploadResolver,
          UserSettingsResolver,
          TransactionsResolver,
          CategoriesResolver,
          SavedCategoriesResolver,
          BudgetsResolver,
        ],
        dateScalarMode: "timestamp",
      });

      return schema;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  const apolloServer = new ApolloServer({
    schema: await generateSchema(),
    context: ({ req, res }) => ({ req, res }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
    bodyParserConfig: { limit: "100mb" },
  });

  app.listen(4000, () => {
    console.log("Express server started at http://localhost:4000");
  });
})();
