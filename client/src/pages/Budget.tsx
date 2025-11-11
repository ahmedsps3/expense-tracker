import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Budget() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("80");

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const startDate = useMemo(() => {
    const date = new Date(now.getFullYear(), now.getMonth(), 1);
    return date.toISOString();
  }, []);

  const endDate = useMemo(() => {
    const date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return date.toISOString();
  }, []);

  const utils = trpc.useUtils();
  const { data: budgets, isLoading: budgetsLoading } = trpc.budgets.list.useQuery({ month: currentMonth });
  const { data: categories } = trpc.categories.getByType.useQuery({ type: "expense" });
  const { data: categoryStats } = trpc.stats.byCategory.useQuery({ startDate, endDate });

  const createMutation = trpc.budgets.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الميزانية بنجاح");
      utils.budgets.list.invalidate();
      setIsDialogOpen(false);
      setCategoryId("");
      setAmount("");
      setAlertThreshold("80");
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const deleteMutation = trpc.budgets.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الميزانية بنجاح");
      utils.budgets.list.invalidate();
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, [categories]);

  const spendingMap = useMemo(() => {
    if (!categoryStats) return {};
    return Object.fromEntries(categoryStats.map(s => [s.categoryId, Number(s.total)]));
  }, [categoryStats]);

  const budgetData = useMemo(() => {
    if (!budgets) return [];
    return budgets.map(budget => {
      const spent = spendingMap[budget.categoryId || 0] || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const isOverBudget = percentage > 100;
      const isNearLimit = percentage >= budget.alertThreshold && percentage <= 100;
      
      return {
        ...budget,
        spent,
        percentage: Math.min(percentage, 100),
        actualPercentage: percentage,
        isOverBudget,
        isNearLimit,
        category: budget.categoryId ? categoriesMap[budget.categoryId] : null,
      };
    });
  }, [budgets, spendingMap, categoriesMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
      toast.error("يرجى إدخال المبلغ");
      return;
    }

    createMutation.mutate({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      amount: parseFloat(amount),
      month: currentMonth,
      alertThreshold: parseInt(alertThreshold),
    });
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
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
      <div className="container max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="ml-2 h-4 w-4" />
                إضافة ميزانية
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>إضافة ميزانية جديدة</DialogTitle>
                  <DialogDescription>
                    حدد ميزانية شهرية لفئة معينة أو للمصروفات الإجمالية
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">الفئة (اختياري)</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="جميع المصروفات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">جميع المصروفات</SelectItem>
                        {categories?.filter(c => !c.parentId).map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">نسبة التنبيه (%)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="0"
                      max="100"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      سيتم تنبيهك عند الوصول إلى هذه النسبة من الميزانية
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      "حفظ"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <h1 className="text-3xl font-bold mb-8">إدارة الميزانية</h1>

        <Card>
          <CardHeader>
            <CardTitle>الميزانيات الشهرية</CardTitle>
            <CardDescription>
              {now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {budgetsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : budgetData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>لم يتم تحديد أي ميزانية بعد</p>
                <p className="text-sm mt-2">ابدأ بإضافة ميزانية جديدة</p>
              </div>
            ) : (
              <div className="space-y-6">
                {budgetData.map((budget) => (
                  <div key={budget.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {budget.category?.name || "جميع المصروفات"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(budget.spent)} من {formatAmount(budget.amount)} ₺
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {budget.isOverBudget && (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">تجاوز الميزانية</span>
                          </div>
                        )}
                        {budget.isNearLimit && !budget.isOverBudget && (
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">قريب من الحد</span>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate({ id: budget.id })}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{budget.actualPercentage.toFixed(1)}%</span>
                        <span className="text-muted-foreground">
                          متبقي: {formatAmount(Math.max(0, budget.amount - budget.spent))} ₺
                        </span>
                      </div>
                      <Progress
                        value={budget.percentage}
                        className={`h-3 ${
                          budget.isOverBudget
                            ? "[&>div]:bg-red-500"
                            : budget.isNearLimit
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-green-500"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
