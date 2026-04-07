import { Link, useLocation } from "wouter";
import { Dumbbell, Users, HeartPulse, Bell, UserCircle } from "lucide-react";
import { ReactNode } from "react";
import { useGetMe, useListNotifications } from "@workspace/api-client-react";

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const { data: notifications = [] } = useListNotifications();
  
  const unreadCount = notifications.filter(n => !n.read && !n.responded).length;

  const navItems = [
    { href: "/", icon: Dumbbell, label: "Dashboard" },
    { href: "/members", icon: Users, label: "Members" },
    { href: "/connections", icon: HeartPulse, label: "Connections" },
    { href: "/notifications", icon: Bell, label: "Alerts", badge: unreadCount },
    { href: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/50 bg-card/50 backdrop-blur-xl shrink-0 p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-crush to-neon-buddy flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            GymLink
          </span>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group shrink-0 md:shrink relative ${isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white"}`}>
                <item.icon className={`w-5 h-5 ${isActive ? "text-neon-crush" : "group-hover:text-neon-buddy transition-colors"}`} />
                <span className="font-semibold hidden md:block">{item.label}</span>
                {item.badge ? (
                  <span className="absolute top-2 right-2 md:relative md:top-auto md:right-auto md:ml-auto w-5 h-5 rounded-full bg-neon-crush flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,51,102,0.5)]">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-card/40 via-background to-background min-h-[100dvh]">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}