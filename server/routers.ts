import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  categories: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    getByType: publicProcedure
      .input(z.object({ type: z.enum(["income", "expense"]) }))
      .query(async ({ input }) => {
        return await db.getCategoriesByType(input.type);
      }),
  }),

  transactions: router({
    list: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getUserTransactions(ctx.user.id, startDate, endDate);
      }),
    
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.number().positive(),
        type: z.enum(["income", "expense"]),
        person: z.string().optional(),
        description: z.string().optional(),
        transactionDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTransaction({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          amount: Math.round(input.amount * 100), // Convert to cents
          type: input.type,
          person: input.person,
          description: input.description,
          transactionDate: new Date(input.transactionDate),
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        amount: z.number().positive().optional(),
        person: z.string().optional(),
        description: z.string().optional(),
        transactionDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
        if (data.amount !== undefined) updateData.amount = Math.round(data.amount * 100);
        if (data.person !== undefined) updateData.person = data.person;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.transactionDate !== undefined) updateData.transactionDate = new Date(data.transactionDate);
        
        return await db.updateTransaction(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteTransaction(input.id, ctx.user.id);
      }),
  }),

  stats: router({
    balance: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getUserBalance(ctx.user.id, startDate, endDate);
      }),
    
    byCategory: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return await db.getSpendingByCategory(ctx.user.id, startDate, endDate);
      }),
  }),

  budgets: router({
    list: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserBudgets(ctx.user.id, input.month);
      }),
    
    create: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        amount: z.number().positive(),
        month: z.string(),
        alertThreshold: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBudget({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          amount: Math.round(input.amount * 100),
          month: input.month,
          alertThreshold: input.alertThreshold || 80,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number().positive().optional(),
        alertThreshold: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        if (data.amount !== undefined) updateData.amount = Math.round(data.amount * 100);
        if (data.alertThreshold !== undefined) updateData.alertThreshold = data.alertThreshold;
        
        return await db.updateBudget(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteBudget(input.id, ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
