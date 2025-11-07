"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  User,
  LogOut,
  Menu,
  CalendarDays,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/reports", label: "My Reports", icon: FileText },
    { href: "/dashboard/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/dashboard/profile", label: "Profile", icon: User },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    logout?.();
    router.push("/login");
  };

  const renderNavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-all",
                isActive && "bg-teal-100 text-teal-700 font-medium shadow-sm"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-[calc(100vh-5rem)] shadow-sm">
        <div className="flex flex-col flex-1 justify-between">
          <nav className="p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Dashboard
            </p>
            {renderNavLinks()}
          </nav>

          <div className="p-4 border-t border-slate-200">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-teal-600 text-teal-600 hover:bg-sky-50 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* --- Mobile Sidebar --- */}
      <div className="md:hidden fixed top-20 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-teal-500 text-teal-700"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-64 bg-white p-4">
            <div className="flex flex-col justify-between h-full">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Dashboard
                </p>
                <div className="space-y-3">{renderNavLinks()}</div>
              </div>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-teal-600 text-teal-700 hover:bg-teal-50 mt-6 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
