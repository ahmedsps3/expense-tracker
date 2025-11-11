import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#ef4444", "#f97316", "#eab308", "#84cc16"];

export default function MonthlyReport() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const { data: transactions, isLoading } = trpc.transactions.list.useQuery({});
  const { data: categories } = trpc.categories.getAll.useQuery();

  // Generate available months and years from transactions
  const { availableMonths, availableYears, monthsList } = useMemo(() => {
    if (!transactions) return { availableMonths: [], availableYears: [], monthsList: [] };

    const monthsSet = new Set<string>();
    const yearsSet = new Set<string>();

    transactions.forEach(t => {
      const date = new Date(t.transactionDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const year = date.getFullYear().toString();
      monthsSet.add(month);
      yearsSet.add(year);
    });

    const months = Array.from(monthsSet).sort().reverse();
    const years = Array.from(yearsSet).sort().reverse();

    if (!selectedMonth && months.length > 0) {
      setSelectedMonth(months[0]);
    }

    return {
      availableMonths: months,
      availableYears: years,
      monthsList: months,
    };
  }, [transactions]);

  // Set default month if not set
  useMemo(() => {
    if (!selectedMonth && monthsList.length > 0) {
      setSelectedMonth(monthsList[0]);
    }
  }, [monthsList]);

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, [categories]);

  // Get current month data
  const currentMonthData = useMemo(() => {
    if (!transactions || !selectedMonth) return { income: 0, expense: 0, byCategory: [] };

    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    let income = 0;
    let expense = 0;
    const categoryMap: Record<number, number> = {};

    transactions.forEach(t => {
      const tDate = new Date(t.transactionDate);
      if (tDate >= startDate && tDate <= endDate) {
        if (t.type === "income") {
          income += t.amount;
        } else {
          expense += t.amount;
          categoryMap[t.categoryId] = (categoryMap[t.categoryId] || 0) + t.amount;
        }
      }
    });

    const byCategory = Object.entries(categoryMap).map(([catId, amount]) => ({
      categoryId: parseInt(catId),
      name: categoriesMap[parseInt(catId)]?.name || "غير محدد",
      value: amount / 100,
    }));

    return {
      income: income / 100,
      expense: expense / 100,
      byCategory: byCategory.sort((a, b) => b.value - a.value),
    };
  }, [transactions, selectedMonth, categoriesMap]);

  // Get year comparison data
  const yearComparisonData = useMemo(() => {
    if (!transactions || !selectedYear) return [];

    const year = parseInt(selectedYear);
    const monthlyData: Record<number, { month: number; income: number; expense: number }> = {};

    transactions.forEach(t => {
      const tDate = new Date(t.transactionDate);
      if (tDate.getFullYear() === year) {
        const month = tDate.getMonth();
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expense: 0 };
        }

        if (t.type === "income") {
          monthlyData[month].income += t.amount / 100;
        } else {
          monthlyData[month].expense += t.amount / 100;
        }
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month - b.month)
      .map(d => ({
        ...d,
        monthName: new Date(year, d.month).toLocaleDateString('ar-EG', { month: 'short' }),
      }));
  }, [transactions, selectedYear]);

  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  const formatMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  };

  const downloadReport = () => {
    const report = {
      شهر: formatMonthName(selectedMonth),
      إجمالي_الدخل: currentMonthData.income,
      إجمالي_المصروفات: currentMonthData.expense,
      الرصيد: currentMonthData.income - currentMonthData.expense,
      المصروفات_حسب_الفئة: currentMonthData.byCategory,
      تاريخ_التقرير: new Date().toLocaleString('ar-EG'),
    };

    const csvContent = [
      ['تقرير المصروفات الشهري'],
      [''],
      ['الشهر', formatMonthName(selectedMonth)],
      ['إجمالي الدخل', currentMonthData.income],
      ['إجمالي المصروفات', currentMonthData.expense],
      ['الرصيد', currentMonthData.income - currentMonthData.expense],
      [''],
      ['المصروفات حسب الفئة'],
      ['الفئة', 'المبلغ'],
      ...currentMonthData.byCategory.map(c => [c.name, c.value]),
      [''],
      ['تاريخ التقرير', new Date().toLocaleString('ar-EG')],
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 py-8">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
          <Button onClick={downloadReport} variant="outline">
            <Download className="ml-2 h-4 w-4" />
            تحميل التقرير
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">التقارير الشهرية</h1>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>اختر الشهر والسنة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">الشهر</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشهر" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {formatMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">السنة</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    {formatAmount(currentMonthData.income)} ₺
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-card">
                <CardHeader className="pb-3">
                  <CardDescription>إجمالي المصروفات</CardDescription>
                  <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                    {formatAmount(currentMonthData.expense)} ₺
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card">
                <CardHeader className="pb-3">
                  <CardDescription>الرصيد</CardDescription>
                  <CardTitle className={`text-3xl ${(currentMonthData.income - currentMonthData.expense) >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatAmount(currentMonthData.income - currentMonthData.expense)} ₺
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>توزيع المصروفات</CardTitle>
                  <CardDescription>حسب الفئات</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentMonthData.byCategory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>لا توجد بيانات</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={currentMonthData.byCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name} (${value.toFixed(0)} ₺)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {currentMonthData.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)} ₺`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Category Details */}
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المصروفات</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentMonthData.byCategory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>لا توجد بيانات</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentMonthData.byCategory.map((item, index) => (
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

            {/* Year Comparison Chart */}
            {yearComparisonData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>مقارنة الدخل والمصروفات - {selectedYear}</CardTitle>
                  <CardDescription>شهري</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={yearComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthName" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `${formatAmount(value)} ₺`} />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10b981" name="الدخل" />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" name="المصروفات" />
                    </LineChart>
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
