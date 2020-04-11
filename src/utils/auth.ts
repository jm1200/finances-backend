import { UserEntity } from "../entity/User";
import { sign } from "jsonwebtoken";

export const createAccessToken = (user: UserEntity) => {
  return sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "1d",
  });
};

export const createRefreshToken = (user: UserEntity) => {
  return sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "7d",
    }
  );
};
