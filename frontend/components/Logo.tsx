import { HeartPulse } from "lucide-react";

export const Logo = () => (
  <div className="flex items-center space-x-2">
    <HeartPulse className="h-6 w-6 text-sky-600 animate-pulse" />
    <span className="text-xl font-bold tracking-tight text-slate-700">
      One<span className="text-sky-600">Health</span>
    </span>
  </div>
);
