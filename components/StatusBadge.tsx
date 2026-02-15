import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    DRAFT: { label: "Draft", variant: "secondary", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
    SENT: { label: "Sent", variant: "default", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
    PAID: { label: "Paid", variant: "default", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    PARTIAL: { label: "Partially Paid", variant: "default", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
    OVERDUE: { label: "Overdue", variant: "destructive", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
    CANCELLED: { label: "Cancelled", variant: "destructive", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
    ACCEPTED: { label: "Accepted", variant: "default", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
    REJECTED: { label: "Rejected", variant: "destructive", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

export function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || { label: status, variant: "outline" as const, className: "" };
    return (
        <Badge variant={config.variant} className={config.className}>
            {config.label}
        </Badge>
    );
}
