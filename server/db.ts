import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema"; // **المسار الصحيح**
import { InsertUser, users, categories, transactions, budgets, InsertTransaction, InsertBudget, InsertCategory, savings, savingsWithdrawals, InsertSaving, InsertSavingsWithdrawal } from "../drizzle/schema";
import { ENV } from './_core/env';


export async function getDb() {
  if (process.env.DATABASE_URL) {
    try {
      // **الإصلاح: إنشاء اتصال جديد في كل مرة**
      const connection = await mysql.createConnection(process.env.DATABASE_URL);
      return drizzle(connection, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      return null;
    }
  }
  return null;
}

export async function createUser(user: { email: string; password: string; name?: string | null }): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values({
    email: user.email,
    password: user.password,
    name: user.name,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  });

  return result[0].insertId;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user: database not available");
    return;
  }

  await db.update(users)
    .set({ lastSignedIn: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId));
}

// Categories
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories);
}

export async function getCategoriesByType(type: "income" | "expense") {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categories).where(eq(categories.type, type));
}

export async function createCategory(category: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(categories).values(category);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(categories)
    .set(data)
    .where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if category is used in transactions
  const usedInTransactions = await db.select().from(transactions)
    .where(eq(transactions.categoryId, id))
    .limit(1);
  
  if (usedInTransactions.length > 0) {
    throw new Error("Cannot delete category that is used in transactions");
  }
  
  return await db.delete(categories).where(eq(categories.id, id));
}

// Transactions
export async function getUserTransactions(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(transactions).where(eq(transactions.userId, userId));
  
  if (startDate && endDate) {
    query = db.select().from(transactions).where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      )
    );
  }
  
  return await query.orderBy(desc(transactions.transactionDate));
}

export async function createTransaction(transaction: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(transactions).values(transaction);
}

export async function updateTransaction(id: number, userId: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(transactions)
    .set(data)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

// Get balance
export async function getUserBalance(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { income: 0, expense: 0, balance: 0 };
  
  let conditions = [eq(transactions.userId, userId)];
  if (startDate && endDate) {
    conditions.push(gte(transactions.transactionDate, startDate));
    conditions.push(lte(transactions.transactionDate, endDate));
  }
  
  const result = await db
    .select({
      type: transactions.type,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.type);
  
  const income = result.find(r => r.type === "income")?.total || 0;
  const expense = result.find(r => r.type === "expense")?.total || 0;
  
  return {
    income: Number(income),
    expense: Number(expense),
    balance: Number(income) - Number(expense),
  };
}

// Get spending by category
export async function getSpendingByCategory(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions = [eq(transactions.userId, userId), eq(transactions.type, "expense")];
  if (startDate && endDate) {
    conditions.push(gte(transactions.transactionDate, startDate));
    conditions.push(lte(transactions.transactionDate, endDate));
  }
  
  return await db
    .select({
      categoryId: transactions.categoryId,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.categoryId);
}

// Budgets
export async function getUserBudgets(userId: number, month: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.month, month)));
}

export async function createBudget(budget: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(budgets).values(budget);
}

export async function updateBudget(id: number, userId: number, data: Partial<InsertBudget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(budgets)
    .set(data)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
}

export async function deleteBudget(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
}

// Savings
export async function getUserSavings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savings)
    .where(eq(savings.userId, userId))
    .orderBy(desc(savings.month));
}

export async function getSavingsByMonth(userId: number, month: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(savings)
    .where(and(eq(savings.userId, userId), eq(savings.month, month)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSaving(saving: InsertSaving) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(savings).values(saving);
}

export async function updateSaving(id: number, userId: number, data: Partial<InsertSaving>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(savings)
    .set(data)
    .where(and(eq(savings.id, id), eq(savings.userId, userId)));
}

export async function deleteSaving(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(savings)
    .where(and(eq(savings.id, id), eq(savings.userId, userId)));
}

// Savings Withdrawals
export async function getUserWithdrawals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(savingsWithdrawals)
    .where(eq(savingsWithdrawals.userId, userId))
    .orderBy(desc(savingsWithdrawals.withdrawalDate));
}

export async function createWithdrawal(withdrawal: InsertSavingsWithdrawal) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(savingsWithdrawals).values(withdrawal);
}

export async function deleteWithdrawal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(savingsWithdrawals)
    .where(and(eq(savingsWithdrawals.id, id), eq(savingsWithdrawals.userId, userId)));
}

// Get total savings
export async function getTotalSavings(userId: number) {
  const db = await getDb();
  if (!db) return { totalSavings: 0, totalWithdrawals: 0, balance: 0 };
  
  const savingsResult = await db
    .select({ total: sql<number>`SUM(${savings.amount})` })
    .from(savings)
    .where(eq(savings.userId, userId));
  
  const withdrawalsResult = await db
    .select({ total: sql<number>`SUM(${savingsWithdrawals.amount})` })
    .from(savingsWithdrawals)
    .where(eq(savingsWithdrawals.userId, userId));
  
  const totalSavings = Number(savingsResult[0]?.total || 0);
  const totalWithdrawals = Number(withdrawalsResult[0]?.total || 0);
  
  return {
    totalSavings,
    totalWithdrawals,
    balance: totalSavings - totalWithdrawals,
  };
}
