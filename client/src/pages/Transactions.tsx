import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, Plus, TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Transactions() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: transactions, isLoading } = trpc.transactions.list.useQuery({});
  const { data: categories } = trpc.categories.getAll.useQuery();
  const { data: balance } = trpc.stats.balance.useQuery({});

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المعاملة بنجاح");
      utils.transactions.list.invalidate();
      utils.stats.balance.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  const categoriesMap = useMemo(() => {
    if (!categories) return {};
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === "all") return transactions;
    return transactions.filter(t => t.type === filter);
  }, [transactions, filter]);

  const formatAmount = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      <div className="container max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")}>
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة للرئيسية
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/transactions/add/income")} variant="outline">
              <Plus className="ml-2 h-4 w-4" />
              دخل
            </Button>
            <Button onClick={() => setLocation("/transactions/add/expense")}>
              <Plus className="ml-2 h-4 w-4" />
              مصروف
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-card">
            <CardHeader className="pb-3">
              <CardDescription>إجمالي الدخل</CardDescription>
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                {balance ? formatAmount(balance.income) : "0.00"} ₺
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-card">
            <CardHeader className="pb-3">
              <CardDescription>إجمالي المصروفات</CardDescription>
              <CardTitle className="text-3xl text-red-600 dark:text-red-400">
                {balance ? formatAmount(balance.expense) : "0.00"} ₺
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card">
            <CardHeader className="pb-3">
              <CardDescription>الرصيد</CardDescription>
              <CardTitle className={`text-3xl ${balance && balance.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                {balance ? formatAmount(balance.balance) : "0.00"} ₺
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المعاملات</SelectItem>
              <SelectItem value="income">الدخل فقط</SelectItem>
              <SelectItem value="expense">المصروفات فقط</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>المعاملات المالية</CardTitle>
            <CardDescription>
              {filteredTransactions.length} معاملة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>لا توجد معاملات بعد</p>
                <p className="text-sm mt-2">ابدأ بإضافة معاملة جديدة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const category = categoriesMap[transaction.categoryId];
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2 rounded-lg ${transaction.type === "income" ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30"}`}>
                          {transaction.type === "income" ? (
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{category?.name || "غير محدد"}</p>
                            {transaction.person && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {transaction.person}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(transaction.transactionDate)}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {transaction.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`text-lg font-bold ${transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {transaction.type === "income" ? "+" : "-"}
                          {formatAmount(transaction.amount)} ₺
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(transaction.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
