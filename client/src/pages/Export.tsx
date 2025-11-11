import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, Download, Upload, FileJson, FileText } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Export() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: transactions } = trpc.transactions.list.useQuery({});
  const { data: budgets } = trpc.budgets.list.useQuery({ month: "" });
  const utils = trpc.useUtils();

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const data = {
        exportDate: new Date().toISOString(),
        transactions: transactions || [],
        budgets: budgets || [],
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-tracker-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      toast.error("خطأ في التصدير");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["التاريخ", "النوع", "الفئة", "المبلغ", "الشخص", "الوصف"];
      const rows = (transactions || []).map(t => [
        new Date(t.transactionDate).toLocaleDateString("ar-EG"),
        t.type === "income" ? "دخل" : "مصروف",
        t.categoryId,
        (t.amount / 100).toFixed(2),
        t.person || "",
        t.description || "",
      ]);

      const csvContent = [
        headers.map(h => `"${h}"`).join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expense-tracker-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("تم تصدير البيانات بنجاح");
    } catch (error) {
      toast.error("خطأ في التصدير");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.transactions && Array.isArray(data.transactions)) {
        toast.success("تم قراءة البيانات بنجاح. يمكنك الآن استيراد البيانات يدويًا من خلال صفحة إضافة المعاملات");
      }
    } catch (error: unknown) {
      toast.error("خطأ في قراءة الملف");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const openGoogleDriveGuide = () => {
    const guide = `
دليل حفظ البيانات على Google Drive:

1. قم بتصدير البيانات بصيغة JSON أو CSV
2. افتح Google Drive (drive.google.com)
3. انقر على "رفع ملف" أو "إنشاء" > "رفع ملف"
4. اختر الملف المُصدَّر
5. بعد الرفع، يمكنك:
   - مشاركة الملف مع أشخاص آخرين
   - الوصول إليه من أي جهاز
   - استرجاع نسخ قديمة من الملف

لاستيراد البيانات:
1. حمّل الملف من Google Drive
2. انقر على "استيراد من ملف"
3. اختر الملف المحمّل
4. سيتم استيراد جميع البيانات تلقائياً
    `;
    alert(guide);
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
        <Button variant="ghost" onClick={() => setLocation("/")} className="mb-6">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <h1 className="text-3xl font-bold mb-8">استيراد وتصدير البيانات</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                تصدير البيانات
              </CardTitle>
              <CardDescription>
                احفظ نسخة من بياناتك على جهازك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  يمكنك تصدير البيانات بصيغ مختلفة:
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={exportToJSON}
                    disabled={isExporting || !transactions}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري التصدير...
                      </>
                    ) : (
                      <>
                        <FileJson className="ml-2 h-4 w-4" />
                        تصدير JSON
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={exportToCSV}
                    disabled={isExporting || !transactions}
                    className="w-full"
                    variant="outline"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري التصدير...
                      </>
                    ) : (
                      <>
                        <FileText className="ml-2 h-4 w-4" />
                        تصدير CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  💡 بعد التصدير، يمكنك رفع الملف على Google Drive للحفظ الآمن
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                استيراد البيانات
              </CardTitle>
              <CardDescription>
                استعد بيانات من ملف سابق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="w-full"
                  variant="outline"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الاستيراد...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      اختر ملف JSON
                    </>
                  )}
                </Button>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  ملاحظة: يتم استيراد البيانات دون حذف البيانات الموجودة
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Google Drive Guide */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              حفظ البيانات على Google Drive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                لحفظ بياناتك بأمان والوصول إليها من أي جهاز، اتبع الخطوات التالية:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li>صدّر البيانات بصيغة JSON من هنا</li>
                <li>افتح Google Drive على drive.google.com</li>
                <li>انقر على "رفع ملف" وحدد الملف المُصدَّر</li>
                <li>بعد الرفع، يمكنك مشاركة الملف أو الوصول إليه من أي جهاز</li>
                <li>لاستعادة البيانات، حمّل الملف من Drive واستيره هنا</li>
              </ol>
              <Button
                onClick={openGoogleDriveGuide}
                variant="outline"
                className="w-full mt-4 border-blue-300 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                عرض دليل مفصل
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>معلومات مهمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">صيغة JSON:</p>
              <p className="text-muted-foreground">
                الأفضل للنسخ الاحتياطية الكاملة، تحتفظ بجميع التفاصيل والتنسيقات
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">صيغة CSV:</p>
              <p className="text-muted-foreground">
                مناسبة لفتح البيانات في Excel أو Google Sheets، سهلة التحرير
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Google Drive:</p>
              <p className="text-muted-foreground">
                خدمة سحابية مجانية من Google توفر 15 GB مساحة تخزين مجانية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
