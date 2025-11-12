import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // For now, we don't authenticate users server-side
  // Authentication is handled on the client with password
  const user: User | null = null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
