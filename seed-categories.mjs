import { drizzle } from "drizzle-orm/mysql2";
import { categories } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

const defaultCategories = [
  // Income categories
  { name: "راتب", type: "income", icon: "Wallet", color: "#10b981" },
  { name: "دخل إضافي", type: "income", icon: "TrendingUp", color: "#3b82f6" },
  { name: "مشاريع جانبية", type: "income", icon: "Briefcase", color: "#8b5cf6" },
  { name: "مكافأة", type: "income", icon: "Gift", color: "#f59e0b" },
  { name: "استثمارات", type: "income", icon: "LineChart", color: "#06b6d4" },
  { name: "أخرى", type: "income", icon: "Plus", color: "#6b7280" },
  
  // Expense categories - Main
  { name: "مصروفات ثابتة", type: "expense", icon: "Home", color: "#ef4444" },
  { name: "اشتراكات مدفوعة", type: "expense", icon: "CreditCard", color: "#f97316" },
  { name: "كورسات ودروس", type: "expense", icon: "GraduationCap", color: "#eab308" },
  { name: "مصروفات سيارة", type: "expense", icon: "Car", color: "#84cc16" },
  { name: "طعام", type: "expense", icon: "UtensilsCrossed", color: "#22c55e" },
  { name: "سوبرماركت", type: "expense", icon: "ShoppingCart", color: "#14b8a6" },
  { name: "مواصلات", type: "expense", icon: "Bus", color: "#06b6d4" },
];

async function seed() {
  console.log("Seeding categories...");
  
  // Insert main categories first
  const insertedCategories = [];
  for (const cat of defaultCategories) {
    const result = await db.insert(categories).values(cat);
    insertedCategories.push({ ...cat, id: Number(result[0].insertId) });
    console.log(`✓ Inserted: ${cat.name}`);
  }
  
  // Now add subcategories
  const fixedExpensesParent = insertedCategories.find(c => c.name === "مصروفات ثابتة");
  const carExpensesParent = insertedCategories.find(c => c.name === "مصروفات سيارة");
  const coursesParent = insertedCategories.find(c => c.name === "كورسات ودروس");
  
  const subcategories = [
    // Fixed expenses subcategories
    { name: "SGK", type: "expense", parentId: fixedExpensesParent.id, icon: "FileText", color: "#ef4444" },
    { name: "إيجار", type: "expense", parentId: fixedExpensesParent.id, icon: "Home", color: "#ef4444" },
    { name: "عائدات", type: "expense", parentId: fixedExpensesParent.id, icon: "Receipt", color: "#ef4444" },
    { name: "فواتير إنترنت - موبايل", type: "expense", parentId: fixedExpensesParent.id, icon: "Wifi", color: "#ef4444" },
    
    // Car expenses subcategories
    { name: "بنزين", type: "expense", parentId: carExpensesParent.id, icon: "Fuel", color: "#84cc16" },
    { name: "مخالفات", type: "expense", parentId: carExpensesParent.id, icon: "AlertTriangle", color: "#84cc16" },
    { name: "تصليح", type: "expense", parentId: carExpensesParent.id, icon: "Wrench", color: "#84cc16" },
    { name: "ضرائب", type: "expense", parentId: carExpensesParent.id, icon: "FileText", color: "#84cc16" },
    
    // Courses subcategories
    { name: "الشيخ", type: "expense", parentId: coursesParent.id, icon: "BookOpen", color: "#eab308" },
    { name: "إرساء", type: "expense", parentId: coursesParent.id, icon: "BookOpen", color: "#eab308" },
  ];
  
  for (const subcat of subcategories) {
    await db.insert(categories).values(subcat);
    console.log(`  ✓ Inserted subcategory: ${subcat.name}`);
  }
  
  console.log("\n✅ Seeding completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
