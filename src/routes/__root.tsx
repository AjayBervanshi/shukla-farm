import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shukla Farms — Banquet & Event Venue Management, Nagpur" },
      {
        name: "description",
        content: "Manage bookings, leads, and payments for Shukla Farms — Nagpur's premier banquet and event venue.",
      },
      { property: "og:title", content: "Shukla Farms — Banquet & Event Venue Management, Nagpur" },
      { property: "og:description", content: "A web application for managing banquet and event venue bookings, leads, and payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Shukla Farms — Banquet & Event Venue Management, Nagpur" },
      { name: "description", content: "A web application for managing banquet and event venue bookings, leads, and payments." },
      { name: "twitter:description", content: "A web application for managing banquet and event venue bookings, leads, and payments." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ded466e6-9a95-44af-8b54-36c2621a8e70/id-preview-de845706--43decf4a-c722-4837-88ef-1ce866207089.lovable.app-1776445734721.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ded466e6-9a95-44af-8b54-36c2621a8e70/id-preview-de845706--43decf4a-c722-4837-88ef-1ce866207089.lovable.app-1776445734721.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl gold-text">404</h1>
        <h2 className="mt-2 text-xl text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-gold-light"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
