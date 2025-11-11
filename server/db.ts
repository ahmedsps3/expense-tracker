import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, transactions, budgets, InsertTransaction, InsertBudget } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
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
