import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, PieChart, Bell } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="container py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt="Logo" className="w-12 h-12 rounded-lg" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">{APP_TITLE}</h1>
                <p className="text-sm text-muted-foreground">مرحباً، {user?.name || "مستخدم"}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link href="/transactions/add/income">
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-green-700 dark:text-green-400">إضافة دخل</CardTitle>
                      <CardDescription>تسجيل دخل جديد</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/transactions/add/expense">
              <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-500 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-red-700 dark:text-red-400">إضافة مصروف</CardTitle>
                      <CardDescription>تسجيل مصروف جديد</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Main Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link href="/transactions">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Wallet className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>المعاملات</CardTitle>
                    <CardDescription>عرض جميع المعاملات المالية</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/statistics">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <PieChart className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>الإحصائيات</CardTitle>
                    <CardDescription>رسوم بيانية وتقارير مفصلة</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/budget">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Bell className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>الميزانية</CardTitle>
                    <CardDescription>إدارة الميزانية والتنبيهات</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/monthly-report">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <CardTitle>التقارير الشهرية</CardTitle>
                    <CardDescription>تقارير مفصلة ومقارنات</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/export">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <CardTitle>الاستيراد والتصدير</CardTitle>
                    <CardDescription>حفظ على Google Drive</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="container py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img src={APP_LOGO} alt="Logo" className="w-24 h-24 rounded-2xl shadow-lg" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
            {APP_TITLE}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            تطبيق ويب تقدمي لتتبع مصروفاتك ودخلك بسهولة، مع رسوم بيانية وإحصائيات تساعدك على إدارة ميزانيتك الشخصية بكفاءة
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <a href={getLoginUrl()}>
              ابدأ الآن
              <ArrowLeft className="mr-2 h-5 w-5" />
            </a>
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-green-500 rounded-lg w-fit mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle>تتبع الدخل والمصروفات</CardTitle>
              <CardDescription>
                سجل جميع معاملاتك المالية بسهولة مع تصنيفات مخصصة للدخل والمصروفات
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-blue-500 rounded-lg w-fit mb-3">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <CardTitle>رسوم بيانية وإحصائيات</CardTitle>
              <CardDescription>
                احصل على رؤية شاملة لمصروفاتك ودخلك من خلال رسوم بيانية تفاعلية
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-purple-500 rounded-lg w-fit mb-3">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <CardTitle>إدارة الميزانية</CardTitle>
              <CardDescription>
                حدد ميزانية شهرية واحصل على تنبيهات عند الاقتراب من حد الإنفاق
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-orange-500 rounded-lg w-fit mb-3">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <CardTitle>تصنيفات مخصصة</CardTitle>
              <CardDescription>
                تصنيفات شاملة للمصروفات الثابتة، السيارة، الطعام، والمزيد
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-teal-500 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <CardTitle>حقول إضافية</CardTitle>
              <CardDescription>
                أضف تفاصيل إضافية لكل معاملة مثل الشخص المسؤول والوصف
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="p-3 bg-pink-500 rounded-lg w-fit mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <CardTitle>مزامنة سحابية</CardTitle>
              <CardDescription>
                بياناتك محفوظة بأمان ومتاحة من أي جهاز
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary to-green-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">ابدأ في إدارة أموالك اليوم</h2>
          <p className="text-lg mb-6 opacity-90">
            انضم الآن واحصل على تحكم كامل في ميزانيتك الشخصية
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <a href={getLoginUrl()}>
              تسجيل الدخول
              <ArrowLeft className="mr-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
