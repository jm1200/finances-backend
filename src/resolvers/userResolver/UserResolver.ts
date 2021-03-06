import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import { hash, compare } from "bcryptjs";
import { UserEntity } from "../../entity/User";
import { MyContext } from "../../MyContext";
import { createAccessToken, createRefreshToken } from "../../utils/auth";
import { isAuth } from "../../isAuth";
import { sendRefreshToken } from "../../utils/sendRefreshToken";
import { getConnection } from "typeorm";
import { ApolloError } from "apollo-server-express";
import { UserSettingsEntity } from "../../entity/UserSettings";
import { LoginResponse, MeResponse, RegisterInput } from "./types";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { createDefaultCategories } from "./defaultData";

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "Hello";
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  bye(@Ctx() { payload }: MyContext) {
    console.log(payload);
    return `your user id is: ${payload!.userId}`;
  }

  @Query(() => UserEntity)
  user(@Ctx() context: MyContext) {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);
    if (!userId) {
      return { user: null };
    }
    return UserEntity.findOne(userId, {
      relations: [
        "userSettings",
        "categories",
        "categories.subCategories",
        "transactions",
        "subCategories",
      ],
    });
  }

  @Query(() => [UserEntity])
  users() {
    return UserEntity.find({ relations: ["userSettings"] });
  }

  @Query(() => MeResponse, { nullable: true })
  async me(@Ctx() context: MyContext): Promise<MeResponse> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]);
    if (!userId) {
      return { user: null };
    }

    // const authorization = context.req.headers["authorization"];
    // //if the user did not pass in authorization inside the header, then deny access
    // if (!authorization) {
    //   return { user: null };
    // }

    try {
      const user = await UserEntity.findOne(userId, {
        relations: ["userSettings"],
      });

      if (user) {
        return { user };
      }
      return { user: null };
    } catch (err) {
      //console.log(err);
      return { user: null };
    }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, "");

    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg("userId") userId: string) {
    await getConnection()
      .getRepository(UserEntity)
      .increment({ id: userId }, "tokenVersion", 1);

    return true;
  }
  //Login returns an access token and also sends a refresh token as a cookie.
  //The client will send that access token to request resources from the server.
  //It sends it inside the headers on the 'authorization' property.
  //The value is a string: "bearer jwtjwtjwtblahrandomcode".
  //users use the access token to gain access to authorized routes.
  //The cookie is then used to refresh the Access token when it expires.
  //the access token is only good for 15min. The refresh for 7d. We can't make the user
  //sign in every 15 min.

  //##### LOGIN MUTATION #############################################################################
  @Mutation(() => LoginResponse)
  async login(
    @Arg("data") { email, password }: RegisterInput,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await UserEntity.findOne({
      where: { email },
      relations: ["userSettings"],
    });

    if (!user) {
      throw new ApolloError("Invalid email");
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      throw new Error("Incorrect password");
    }

    //login successful

    //res.cookie send refresh token in cookie/jid
    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user,
    };
  }
  //##### REGISTER MUTATION #############################################################################
  @Mutation(() => LoginResponse)
  async register(
    @Arg("data") { email, password }: RegisterInput,
    @Ctx() { req, res }: MyContext
  ): Promise<LoginResponse> {
    const hashedPassword = await hash(password, 12);

    try {
      const userSettings = UserSettingsEntity.create({ theme: "dark" });
      await userSettings.save();

      const user = await UserEntity.create({
        email,
        password: hashedPassword,
        userSettingsId: userSettings.id,
      }).save();

      await createDefaultCategories(user.id);

      const data = { email, password };
      return this.login(data, { req, res });
    } catch (err) {
      console.log("test error", err);
      throw new ApolloError(err.message);
    }
  }
}
