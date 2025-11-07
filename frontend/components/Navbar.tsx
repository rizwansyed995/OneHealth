"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeartPulse, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import router from "next/router";

export const Navbar = () => {
  const { user, logout,name,setName  } = useAuth();
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    logout?.();
    router.push("/login");
  };

  return (
    <motion.nav
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/40 shadow-sm"
    >
      <div className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <HeartPulse className="h-6 w-6 text-teal-600 animate-pulse" />
          <span className="text-2xl font-bold tracking-tight text-slate-800">
            One<span className="text-teal-600">Health</span>
          </span>
        </Link>

        {/* Auth Buttons */}
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-slate-700 text-sm font-medium">
              Welcome, {name}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-teal-600 text-teal-600 hover:bg-sky-50 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="space-x-3">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-sky-50"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </motion.nav>
  );
};
