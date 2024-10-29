import { JwtUser } from "@type/jwt-user.type";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}