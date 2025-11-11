import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AddTransaction from "./pages/AddTransaction";
import EditTransaction from "./pages/EditTransaction";
import Transactions from "./pages/Transactions";
import Statistics from "./pages/Statistics";
import Budget from "./pages/Budget";
import MonthlyReport from "./pages/MonthlyReport";
import Export from "./pages/Export";
import Splash from "./pages/Splash";
import { useState, useEffect } from "react";

function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/transactions/add/:type" component={AddTransaction} />
      <Route path="/transactions/edit/:id" component={EditTransaction} />
      <Route path="/statistics" component={Statistics} />
      <Route path="/budget" component={Budget} />
      <Route path="/monthly-report" component={MonthlyReport} />
      <Route path="/export" component={Export} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  const [isAppAuthenticated, setIsAppAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has already authenticated in this session
    const hasSession = localStorage.getItem("app-session") === "true";
    setIsAppAuthenticated(hasSession);
    setIsLoading(false);
  }, []);

  const handlePasswordCorrect = () => {
    setIsAppAuthenticated(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAppAuthenticated) {
    return (
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Splash onPasswordCorrect={handlePasswordCorrect} />
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router isAuthenticated={isAppAuthenticated} />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
