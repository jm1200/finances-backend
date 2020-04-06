import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  UseMiddleware,
  Int,
} from "type-graphql";
import { hash, compare } from "bcryptjs";
import { User } from "../../entity/User";
import { MyContext } from "../../MyContext";
import { createAccessToken, createRefreshToken } from "../../utils/auth";
import { isAuth } from "../../isAuth";
import { sendRefreshToken } from "../../utils/sendRefreshToken";
import { getConnection } from "typeorm";
import { verify } from "jsonwebtoken";
import { ApolloError } from "apollo-server-express";
import { UserSettings } from "../../entity/UserSettings";
import { LoginResponse, MeResponse, RegisterInput } from "./types";

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

  @Query(() => [User])
  users() {
    return User.find();
  }

  @Query(() => MeResponse, { nullable: true })
  async me(@Ctx() context: MyContext): Promise<MeResponse> {
    const authorization = context.req.headers["authorization"];
    //if the user did not pass in authorization inside the header, then deny access
    if (!authorization) {
      return { user: null, userSettings: null };
    }
    try {
      const token = authorization.split(" ")[1];
      const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
      const user = await User.findOne(payload.userId);
      //if there is an authorization header, there will be a user.
      const userSettings = await UserSettings.findOne(user!.id);
      return { user: user!, userSettings: userSettings! };
    } catch (err) {
      console.log(err);
      return { user: null, userSettings: null };
    }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    sendRefreshToken(res, "");

    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg("userId", () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
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
  @Mutation(() => LoginResponse)
  async login(
    @Arg("data") { email, password }: RegisterInput,
    @Ctx() { res }: MyContext
  ): Promise<LoginResponse> {
    const user = await User.findOne({ where: { email } });

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
    const userSettings = await UserSettings.findOne(user.id);

    return {
      accessToken: createAccessToken(user),
      user,
      userSettings: userSettings!,
    };
  }

  @Mutation(() => LoginResponse)
  async register(
    @Arg("data") { email, password }: RegisterInput,

    @Ctx() { req, res }: MyContext
  ): Promise<LoginResponse> {
    const hashedPassword = await hash(password, 12);

    try {
      const userInsert = await User.insert({
        email,
        password: hashedPassword,
      });

      const userId: number = userInsert.raw[0].id;
      await UserSettings.insert({
        userId,
        theme: "dark",
      });
    } catch (err) {
      console.log("test error", err);
      throw new ApolloError(err.message);
    }
    const data = { email, password };
    return this.login(data, { req, res });
  }
}
