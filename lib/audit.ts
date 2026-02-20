import { prisma } from "@/lib/prisma";

export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "VIEW"
    | "EXPORT"
    | "LOGIN"
    | "SETTINGS_CHANGE"
    | "DATA_PURGE";

export type AuditResource =
    | "Invoice"
    | "Client"
    | "Quote"
    | "Payment"
    | "Expense"
    | "Project"
    | "RecurringInvoice"
    | "Settings"
    | "DataExport"
    | "System"
    | "Pipeline"
    | "Deal"
    | "DocumentSignature"
    | "ProfitBucket"
    | "ExpenseBudget";

interface AuditEventOptions {
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    actor?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    userId: string;
}

/**
 * Log an audit event to the database.
 * Failures are silently caught so they never break the main operation.
 */
export async function logAuditEvent(opts: AuditEventOptions): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                action: opts.action,
                resource: opts.resource,
                resourceId: opts.resourceId,
                actor: opts.actor ?? "system",
                ipAddress: opts.ipAddress,
                metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
                userId: opts.userId,
            },
        });
    } catch (err) {
        // Audit log failures must never break the main flow
        console.error("[AuditLog] Failed to write audit event:", err);
    }
}

