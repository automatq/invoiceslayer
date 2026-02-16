"use client"

import { Button } from "@/components/ui/button"
import { InteractiveButton } from "@/components/ui/interactive-button"
import { Download } from "lucide-react"

export function DownloadReportButton({ data, filename = "report.csv" }: { data: any[], filename?: string }) {
    const handleDownload = () => {
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(","),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <InteractiveButton variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </InteractiveButton>
    )
}
