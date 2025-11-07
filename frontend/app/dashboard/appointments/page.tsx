"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Clock, User, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AppointmentsPage() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [doctor, setDoctor] = useState("");
  const [time, setTime] = useState("");
  
  const upcoming = [
    { id: 1, date: "Nov 5, 2025", doctor: "Dr. Ayesha Khan", specialization: "Cardiologist" },
  ];
  const past = [
    { id: 1, date: "Oct 2, 2025", doctor: "Dr. Rohit Sharma", specialization: "Endocrinologist" },
  ];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Appointment booked with ${doctor} on ${date?.toDateString()} at ${time}`);
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
        <Button onClick={() => setOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
          Book New Appointment
        </Button>
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Upcoming Appointments</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {upcoming.map((a) => (
            <Card key={a.id} className="shadow-sm hover:shadow-md bg-white/90">
              <CardHeader>
                <CardTitle className="text-teal-700 flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" /> {a.date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 font-medium">{a.doctor}</p>
                <p className="text-sm text-slate-500">{a.specialization}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Past */}
      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Past Appointments</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {past.map((a) => (
            <Card key={a.id} className="shadow-sm bg-white/90">
              <CardHeader>
                <CardTitle className="text-slate-700">{a.date}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 font-medium">{a.doctor}</p>
                <p className="text-sm text-slate-500">{a.specialization}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Dialog for Booking */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-white/90 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-teal-700">Book New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="text-sm text-slate-600">Select Date</label>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border mt-2" />
            </div>
            <div>
              <label className="text-sm text-slate-600">Doctor Name</label>
              <Input placeholder="Enter doctor's name" value={doctor} onChange={(e) => setDoctor(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Time</label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white">
              Confirm Appointment
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
