"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function StepTwoForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [form, setForm] = useState({
    name: "",
    gender: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    bloodGroup: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const userBase = JSON.parse(localStorage.getItem("user_base") || "{}");

  try {
    // 1️⃣ Login to get access token
    const loginRes = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userBase.email,
        password: userBase.password,
      }),
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.detail || "Login failed");

    const token = loginData.access_token;

    // 2️⃣ Update patient details
    const updateRes = await fetch("http://localhost:8000/patients/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        age: date ? new Date().getFullYear() - date.getFullYear() : null,
        gender: form.gender,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
        },
        bloodGroup: form.bloodGroup,
      }),
    });

    const updateData = await updateRes.json();
    if (!updateRes.ok) throw new Error(updateData.detail || "Update failed");

    toast.success("Patient details updated successfully!");
    localStorage.removeItem("user_base");

    router.push("/login");
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};


  return (
    <Card className="m-20 w-full max-w-2xl mx-auto shadow-lg border border-slate-200 bg-white/80 backdrop-blur-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Patient Details</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name + DOB */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="name" onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    fromYear={1940}
                    toYear={2025}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Gender + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <select
                name="gender"
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 p-2"
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" type="tel" onChange={handleChange} required />
            </div>
          </div>

          {/* Address Row */}
          <div className="space-y-2">
            <Label>Address</Label>
            <div className="grid grid-cols-4 gap-3">
              <Input name="street" placeholder="Street" onChange={handleChange} required />
              <Input name="city" placeholder="City" onChange={handleChange} required />
              <Input name="state" placeholder="State" onChange={handleChange} required />
              <Input name="zip" placeholder="ZIP" onChange={handleChange} required />
            </div>
          </div>

          {/* Blood Group */}
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <select
              name="bloodGroup"
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 p-2"
            >
              <option value="">Select</option>
              {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-contain  bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? "Registering..." : "Finish Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
