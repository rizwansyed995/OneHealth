"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Heart,
  Bell,
  Trash2,
  Droplets,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [steps, setSteps] = useState<number>(0);
  const [loadingSteps, setLoadingSteps] = useState<boolean>(true);
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminders, setReminders] = useState<{ text: string; time: string }[]>([]);
  const [sugarLevel] = useState<number | null>(null);

  const { user, loading, name, setName, token } = useAuth(); // ✅ ensure token is accessible
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // Fetch patient name once logged in
  useEffect(() => {
    if (!user || !token) return;

    const fetchPatient = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/auth/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch patient details");

        const data = await res.json();
        if (data.name) {
          setName(data.name);
        } else {
          toast.error("No name found in patient data");
        }
      } catch (err) {
        console.error(err);
        toast.error("Could not load patient details");
      }
    };

    fetchPatient();
  }, [user, token, setName]);

  // Fetch fitness steps
  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setLoadingSteps(true);
        const res = await fetch("http://127.0.0.1:8000/fit/get-metrics");
        if (!res.ok) throw new Error("Failed to fetch step data");
        const data = await res.json();
        setSteps(data.steps || 0);
      } catch (err) {
        console.error(err);
        toast.error("Could not fetch steps data");
      } finally {
        setLoadingSteps(false);
      }
    };

    fetchSteps();
  }, []);


  if (!user) return null;

  // Dummy chart data
  const stepsData = [
    { day: "Mon", steps: 3210 },
    { day: "Tue", steps: 4780 },
    { day: "Wed", steps: 5420 },
    { day: "Thu", steps: 6100 },
    { day: "Fri", steps: 3820 },
    { day: "Sat", steps: 7210 },
    { day: "Sun", steps: 4980 },
  ];

  const heartRateData = [
    { day: "Mon", bpm: 75 },
    { day: "Tue", bpm: 80 },
    { day: "Wed", bpm: 72 },
    { day: "Thu", bpm: 90 },
    { day: "Fri", bpm: 84 },
    { day: "Sat", bpm: 78 },
    { day: "Sun", bpm: 76 },
  ];

  const sugarData = [
    { day: "Mon", sugar: 95 },
    { day: "Tue", sugar: 104 },
    { day: "Wed", sugar: 98 },
    { day: "Thu", sugar: 110 },
    { day: "Fri", sugar: 102 },
    { day: "Sat", sugar: 99 },
    { day: "Sun", sugar: 105 },
  ];

  // === Reminder Logic ===
  const addReminder = async () => {
    if (!reminderText.trim() || !reminderTime.trim()) return;

    const newReminder = { text: reminderText, time: reminderTime };
    setReminders([...reminders, newReminder]);

    setReminderText("");
    setReminderTime("");
  };

  const deleteReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-slate-800">
        Welcome back, <span className="text-teal-600">{name}</span> 👋
      </h1>

      {/* === Top Row (Steps + Heart Rate) === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Steps */}
        <Card className="shadow-md border-slate-200 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Activity className="h-5 w-5 text-teal-600" /> Step Count (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-700 mb-2">
              {loadingSteps ? "..." : steps.toLocaleString()}
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Steps recorded today
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stepsData}>
                <Line type="monotone" dataKey="steps" stroke="#0f766e" strokeWidth={2} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heart Rate */}
        <Card className="shadow-md border-slate-200 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Heart className="h-5 w-5 text-red-600" /> Heart Rate (Avg)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600 mb-2">82 bpm</div>
            <p className="text-sm text-slate-500 mb-4">Average heart rate</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={heartRateData}>
                <Line type="monotone" dataKey="bpm" stroke="#dc2626" strokeWidth={2} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* === Bottom Row (Sugar + Reminders) === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sugar */}
        <Card className="shadow-md border-slate-200 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Droplets className="h-5 w-5 text-sky-600" /> Blood Sugar (Glucose)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-sky-700 mb-2">
              {sugarLevel ?? "105"} mg/dL
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Average glucose level this week
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sugarData}>
                <Line type="monotone" dataKey="sugar" stroke="#0284c7" strokeWidth={2} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card className="shadow-md border-slate-200 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Bell className="h-5 w-5 text-amber-500" /> Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Add a reminder..."
                value={reminderText}
                onChange={(e) => setReminderText(e.target.value)}
              />
              <Input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={addReminder}
              >
                Add
              </Button>
            </div>

            <ul className="space-y-2">
              {reminders.length === 0 ? (
                <p className="text-slate-500 text-sm">No reminders yet.</p>
              ) : (
                reminders.map((rem, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between items-center p-2 bg-slate-100 rounded-md"
                  >
                    <div>
                      <span className="font-medium">{rem.text}</span>
                      <p className="text-xs text-slate-500">{rem.time}</p>
                    </div>
                    <button
                      onClick={() => deleteReminder(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
