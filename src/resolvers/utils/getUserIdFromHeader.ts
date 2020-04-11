import { verify } from "jsonwebtoken";

export const getUserIdFromHeader = (
  authHeader: string | undefined
): string | number | null => {
  if (!authHeader) {
    return null;
  }
  try {
    const token = authHeader.split(" ")[1];
    const payload: any = verify(token, process.env.ACCESS_TOKEN_SECRET!);
    if (payload) {
      return payload.userId;
    } else {
      return null;
    }
  } catch (err) {
    console.log("Could not verify user token");
    return null;
  }
};
