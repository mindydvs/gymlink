import { Link, useLocation } from "wouter";
import { LayoutGrid, Users, Link2, Bell, UserCircle, ChefHat } from "lucide-react";
import { ReactNode } from "react";
import { useListNotifications } from "@workspace/api-client-react";
import logoImg from "/logo.png";

const navItems = [
  { href: "/", icon: LayoutGrid, label: "Dashboard" },
  { href: "/members", icon: Users, label: "Members" },
  { href: "/connections", icon: Link2, label: "Connections" },
  { href: "/recipes", icon: ChefHat, label: "Recipes" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: notifications = [] } = useListNotifications();
  const unreadCount = notifications.filter((n) => !n.read && !n.responded).length;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex w-[220px] xl:w-[240px] shrink-0 flex-col h-screen sticky top-0 overflow-y-auto"
        style={{ background: "hsl(var(--sidebar))", borderRight: "1px solid hsl(var(--sidebar-border))" }}>

        {/* Logo */}
        <div className="px-5 py-6">
          <img src={logoImg} alt="GymLink" className="h-16 w-auto object-contain" />
        </div>

        <div className="h-px mx-5" style={{ background: "hsl(var(--sidebar-border))" }} />

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const showBadge = item.href === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group ${
                  isActive
                    ? "bg-[hsl(var(--primary)/0.12)] text-white"
                    : "text-[hsl(var(--muted-foreground))] hover:text-white hover:bg-[hsl(var(--sidebar-accent))]"
                }`}
                data-testid={`nav-${item.href.replace("/", "") || "dashboard"}`}
              >
                <item.icon
                  className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? "text-[hsl(var(--primary))]" : ""}`}
                />
                <span className="text-sm font-semibold">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: "hsl(var(--primary))" }}>
                    {unreadCount}
                  </span>
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "hsl(var(--primary))" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom gym label */}
        <div className="px-5 py-4">
          <div className="h-px mb-4" style={{ background: "hsl(var(--sidebar-border))" }} />
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "hsl(var(--muted-foreground))" }}>
            Iron Temple Fitness
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ background: "hsl(var(--sidebar))", borderBottom: "1px solid hsl(var(--sidebar-border))" }}>
        <img src={logoImg} alt="GymLink" className="h-7 w-auto object-contain" />
        {unreadCount > 0 && (
          <Link href="/notifications">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: "hsl(var(--primary))" }}>
              {unreadCount}
            </span>
          </Link>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-x-hidden pt-[60px] md:pt-0"
        style={{ background: "hsl(var(--background))" }}>
        <div className="max-w-[900px] mx-auto px-5 py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe"
        style={{ background: "hsl(var(--sidebar))", borderTop: "1px solid hsl(var(--sidebar-border))", paddingBottom: "env(safe-area-inset-bottom, 12px)", paddingTop: "10px" }}>
        {navItems.map((item) => {
          const isActive = location === item.href;
          const showBadge = item.href === "/notifications" && unreadCount > 0;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative ${isActive ? "text-white" : "text-[hsl(var(--muted-foreground))]"}`}>
              <item.icon className={`w-5 h-5 ${isActive ? "text-[hsl(var(--primary))]" : ""}`} />
              <span className="text-[10px] font-semibold">{item.label}</span>
              {showBadge && (
                <span className="absolute -top-0.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: "hsl(var(--primary))" }}>
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
