"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileText, UploadCloud, Loader2 } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000"; // Update for production if needed

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summaryPDF, setSummaryPDF] = useState(null);
  // === Fetch reports from backend ===
  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // assuming JWT stored here
      const res = await fetch(`${API_BASE}/upload/my-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // === Secure Download File ===
  const downloadFile = async (report: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/upload/file/${report.s3_key}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link to download file
      const a = document.createElement("a");
      a.href = url;
      a.download = report.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the object URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed. Please try again.");
    }
  };

  // === Handle Upload ===
  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/upload/file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");

      alert("File uploaded successfully!");
      setFile(null);
      fetchReports();
    } catch (err) {
      alert("Upload failed: " + err);
    } finally {
      setUploading(false);
    }
  };


  // === Handle View ===
  const handleView = async (report: any) => {
    setSelectedReport(report);
    setDialogOpen(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/upload/file/${report.s3_key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch report preview");
      }

      // Convert response to blob for preview
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Attach blob URL to selected report
      setSelectedReport((prev: any) => ({
        ...prev,
        previewUrl: url,
        mimeType: blob.type,
      }));
    } catch (err) {
      console.error("Preview error:", err);
      alert("Failed to preview report. Try downloading instead.");
    }
  };


  const handleSummarizeReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/upload/summarize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Failed to summarize reports");
      }

      // If your backend returns the PDF directly as a FileResponse:
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/pdf")) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "summarized_reports.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      }

      // Otherwise, if backend returns a JSON with `summary_pdf_url`
      const data = await res.json();
      if (data.summary_pdf_url) {
        const pdfResponse = await fetch(data.summary_pdf_url);
        const blob = await pdfResponse.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "summarized_reports.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        alert("pdf banna chahiye");
      } else {
        alert("No PDF URL returned from server.");
      }
    } catch (err) {
      console.error("Error summarizing reports:", err);
      alert("Failed to generate summary PDF. Check logs.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My Reports</h1>

      {/* Upload Section */}
      <div className="flex items-center justify-between gap-3">
        <div className="contain flex items-center justify-around">
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full max-w-sm mr-3"
          />
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
          >
            {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <Button
          className="mt-2 w-contain bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleSummarizeReports}
          disabled={loading}
        >
          {loading ? "Generating Summary..." : "Summarize My Reports"}
        </Button>

      </div>

      {/* Reports Grid */}
      {loading ? (
        <p className="text-slate-500">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-slate-500">No reports uploaded yet.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card
              key={report.file_id}
              className="border-slate-200 shadow-sm hover:shadow-md transition bg-white/90"
            >
              <CardHeader>
                <CardTitle className="text-md font-semibold text-teal-700 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {report.original_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-600">
                  Uploaded on:{" "}
                  {new Date(report.upload_time).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleView(report)}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadFile(report)}
                    className="border-teal-600 text-teal-700"
                  >
                    Download
                  </Button>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {/* Report Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl bg-white/90 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-teal-700">
              {selectedReport?.original_name} Preview
            </DialogTitle>
          </DialogHeader>

          <div className="h-[500px] bg-slate-50 rounded-md border flex items-center justify-center">
            {selectedReport?.previewUrl ? (
              selectedReport.mimeType.startsWith("image/") ? (
                <img
                  src={selectedReport.previewUrl}
                  alt="Report Preview"
                  className="max-h-full max-w-full rounded-md"
                />
              ) : selectedReport.mimeType === "application/pdf" ? (
                <iframe
                  src={selectedReport.previewUrl}
                  className="w-full h-full rounded-md"
                  title="Report Preview"
                />
              ) : (
                <p className="text-slate-500 text-sm">
                  Preview not supported for this file type.
                </p>
              )
            ) : (
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
