import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { authRouter } from "./_core/auth";
import * as dbExtended from "./db_extended";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,

  categories: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    getByType: publicProcedure
      .input(z.object({ type: z.enum(["income", "expense"]) }))
      .query(async ({ input }) => {
        return await db.getCategoriesByType(input.type);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["income", "expense"]),
        icon: z.string().max(50).optional(),
        color: z.string().max(20).optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCategory({
          name: input.name,
          type: input.type,
          icon: input.icon,
          color: input.color,
          createdAt: new Date(),
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().max(50).optional(),
        color: z.string().max(20).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateCategory(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteCategory(input.id);
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
        accountType: z.enum(["cash", "bank"]).default("cash"),
        description: z.string().optional(),
        transactionDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createTransaction({
          userId: ctx.user.id,
          categoryId: input.categoryId,
          amount: Math.round(input.amount * 100),
          type: input.type,
          accountType: input.accountType,
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

  savings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSavings(ctx.user.id);
    }),
    
    getByMonth: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return await db.getSavingsByMonth(ctx.user.id, input.month);
      }),
    
    total: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTotalSavings(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        month: z.string(),
        accountType: z.enum(["cash", "bank"]).default("cash"),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createSaving({
          userId: ctx.user.id,
          amount: Math.round(input.amount * 100),
          month: input.month,
          accountType: input.accountType,
          description: input.description,
          createdAt: new Date(),
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        if (data.amount !== undefined) updateData.amount = Math.round(data.amount * 100);
        if (data.description !== undefined) updateData.description = data.description;
        
        return await db.updateSaving(id, ctx.user.id, updateData);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteSaving(input.id, ctx.user.id);
      }),
  }),

  withdrawals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserWithdrawals(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        accountType: z.enum(["cash", "bank"]).default("cash"),
        description: z.string().optional(),
        withdrawalDate: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createWithdrawal({
          userId: ctx.user.id,
          amount: Math.round(input.amount * 100),
          accountType: input.accountType,
          description: input.description,
          withdrawalDate: new Date(input.withdrawalDate),
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteWithdrawal(input.id, ctx.user.id);
      }),
  }),

  monthlyData: router({
    getSummary: protectedProcedure
      .input(z.object({ 
        month: z.string().regex(/^\d{4}-\d{2}$/)
      }))
      .query(async ({ ctx, input }) => {
        return await dbExtended.getMonthlySummary(ctx.user.id, input.month);
      }),

    getArchive: protectedProcedure
      .query(async ({ ctx }) => {
        return await dbExtended.getUserMonthsArchive(ctx.user.id);
      }),

    getComparison: protectedProcedure
      .input(z.object({ 
        months: z.array(z.string().regex(/^\d{4}-\d{2}$/)).min(2).max(12) 
      }))
      .query(async ({ ctx, input }) => {
        return await dbExtended.getMonthsComparison(ctx.user.id, input.months);
      }),

    getCurrentMonth: publicProcedure
      .query(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
      }),
  }),
});

export type AppRouter = typeof appRouter;
