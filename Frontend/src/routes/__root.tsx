import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/error-reporting";
import { AppProvider } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { DashboardProvider } from "@/context/DashboardContext";
import { useAuthStore } from "@/stores/authStore";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-red-600">
          This page didn't load
        </h1>
        <p className="text-muted-foreground text-red-500">
          {error?.message || "Something went wrong on our end. You can try refreshing or head back home."}
        </p>
        <pre className="text-left text-xs bg-red-100 p-4 rounded text-red-800 overflow-auto mx-auto max-h-64">
          {error?.stack}
        </pre>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "🌿 AgriTwin Intelligence — AI Precision Agriculture Digital Twin" },
      { name: "description", content: "AI-powered digital twin for precision agriculture: live crop health, disease & pest monitoring, yield prediction and AI recommendations." },
      { name: "author", content: "AgriTwin Intelligence" },
      { property: "og:title", content: "🌿 AgriTwin Intelligence — AI Precision Agriculture" },
      { property: "og:description", content: "Live digital twin of your farm with AI insights, heatmaps and yield forecasts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Pages that render WITHOUT the dashboard Layout (auth pages, landing)
const AUTH_ROUTES = ["/landing", "/login", "/register", "/forgot-password"];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isAuthPage = AUTH_ROUTES.includes(currentPath);

  return (
    <QueryClientProvider client={queryClient}>
      {isAuthPage ? (
        // Auth pages render WITHOUT the dashboard layout
        <Outlet />
      ) : (
        // Dashboard pages render WITH the full layout
        <AuthGuard>
          <AppProvider>
            <DashboardProvider>
              <Layout>
                {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                <Outlet />
              </Layout>
            </DashboardProvider>
          </AppProvider>
        </AuthGuard>
      )}
    </QueryClientProvider>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.navigate({ to: "/landing" });
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#040e0a] flex flex-col items-center justify-center gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
          </span>
          <span className="text-base font-semibold text-emerald-100">Loading AgriTwin Intelligence...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
