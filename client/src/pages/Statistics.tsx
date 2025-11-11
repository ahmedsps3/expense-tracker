import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = [
  "#10b981", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
];

export default function Statistics() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<"month" | "year">("month");

  const now = new Date();
  const startDate = useMemo(() => {
    const date = new Date(now);
    if (period === "month") {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    } else {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }
    return date.toISOString();
  }, [period]);

  const endDate = useMemo(() => {
    const date = new Date(now);
    if (period === "month") {
      date.setMonth(date.getMonth() + 1, 0);
      date.setHours(23, 59, 59, 999);
    } else {
      date.setMonth(11, 31);
      date.setHours(23, 59, 59, 999);
    }
    return date.toISOString();
  }, [period]);

  const { data: balance, isLoading: balanceLoading } = trpc.stats.balance.useQuery({ startDate, endDate });
  const { data: categoryStats, isLoading: statsLoading } = trpc.stats.byCategory.useQuery({ startDate, endDate });
  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: transactions } = trpc.transactions.list.useQuery({ startDate, endDate });

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, [categories]);

  const pieData = useMemo(() => {
    if (!categoryStats || !categories) return [];
    return categoryStats
      .map(stat => ({
        name: categoriesMap[stat.categoryId]?.name || "غير محدد",
        value: Number(stat.total) / 100,
        categoryId: stat.categoryId,
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryStats, categoriesMap]);

  const monthlyData = useMemo(() => {
    if (!transactions) return [];
    
    const monthsMap: Record<string, { month: string; income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      
      if (t.type === "income") {
        monthsMap[monthKey].income += t.amount / 100;
      } else {
        monthsMap[monthKey].expense += t.amount / 100;
      }
    });
    
    return Object.values(monthsMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const isLoading = balanceLoading || statsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 py-8">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">هذا الشهر</SelectItem>
              <SelectItem value="year">هذا العام</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <h1 className="text-3xl font-bold mb-8">الإحصائيات والتقارير</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-card">
                <CardHeader className="pb-3">
                  <CardDescription>إجمالي الدخل</CardDescription>
                  <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                    {balance ? formatAmount(balance.income / 100) : "0.00"} ₺
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-card">
                <CardHeader className="pb-3">
                  <CardDescription>إجمالي المصروفات</CardDescription>
                  <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                    {balance ? formatAmount(balance.expense / 100) : "0.00"} ₺
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card">
                <CardHeader className="pb-3">
                  <CardDescription>الرصيد</CardDescription>
                  <CardTitle className={`text-3xl ${balance && balance.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                    {balance ? formatAmount(balance.balance / 100) : "0.00"} ₺
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>المصروفات حسب الفئة</CardTitle>
                  <CardDescription>توزيع المصروفات على الفئات المختلفة</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>لا توجد بيانات لعرضها</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${formatAmount(value)} ₺`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category List */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المصروفات</CardTitle>
                  <CardDescription>قائمة المصروفات مرتبة حسب القيمة</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>لا توجد بيانات لعرضها</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pieData.map((item, index) => (
                        <div key={item.categoryId} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {formatAmount(item.value)} ₺
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Bar Chart */}
            {period === "year" && monthlyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>الدخل والمصروفات الشهرية</CardTitle>
                  <CardDescription>مقارنة الدخل والمصروفات على مدار العام</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={formatMonthName} />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => `${formatAmount(value)} ₺`}
                        labelFormatter={formatMonthName}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10b981" name="الدخل" />
                      <Bar dataKey="expense" fill="#ef4444" name="المصروفات" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
