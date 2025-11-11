import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";

export default function AddTransaction() {
  const [, params] = useRoute("/transactions/add/:type");
  const type = (params?.type as "income" | "expense") || "expense";
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [person, setPerson] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: categories, isLoading: categoriesLoading } = trpc.categories.getByType.useQuery({ type });
  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      toast.success(type === "income" ? "تم إضافة الدخل بنجاح" : "تم إضافة المصروف بنجاح");
      setLocation("/transactions");
    },
    onError: (error) => {
      toast.error("حدث خطأ: " + error.message);
    },
  });

  // Organize categories by parent
  const { mainCategories, subcategories } = useMemo(() => {
    if (!categories) return { mainCategories: [], subcategories: {} };
    
    const main = categories.filter(c => !c.parentId);
    const subs: Record<number, typeof categories> = {};
    
    categories.forEach(c => {
      if (c.parentId) {
        if (!subs[c.parentId]) subs[c.parentId] = [];
        subs[c.parentId].push(c);
      }
    });
    
    return { mainCategories: main, subcategories: subs };
  }, [categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !categoryId || !transactionDate) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    createMutation.mutate({
      categoryId: parseInt(categoryId),
      amount: parseFloat(amount),
      type,
      person: person || undefined,
      description: description || undefined,
      transactionDate,
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
      <div className="container max-w-2xl">
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-6">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {type === "income" ? "إضافة دخل جديد" : "إضافة مصروف جديد"}
            </CardTitle>
            <CardDescription>
              {type === "income" 
                ? "سجل مصدر دخل جديد مع التفاصيل"
                : "سجل مصروف جديد مع التفاصيل"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">الفئة *</Label>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories.map((cat) => (
                        <div key={cat.id}>
                          <SelectItem value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                          {subcategories[cat.id]?.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id.toString()} className="pr-8">
                              ← {sub.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">التاريخ *</Label>
                <Input
                  id="date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="person">الشخص المسؤول</Label>
                <Input
                  id="person"
                  type="text"
                  placeholder="من قام بالصرف أو الإيداع؟"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">التفاصيل</Label>
                <Textarea
                  id="description"
                  placeholder="أضف أي تفاصيل إضافية..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    "حفظ"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/transactions")}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
