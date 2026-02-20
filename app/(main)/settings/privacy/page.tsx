import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-10 py-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Privacy & Data</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your data rights under GDPR and review your privacy settings.
                </p>
            </div>

            {/* Data Rights */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Your Data Rights (GDPR)</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-5 space-y-2">
                        <h3 className="font-medium">📤 Export Your Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Download a full JSON export of all personal data held in InvoiceSlayer (Art. 20 — Right to Portability).
                        </p>
                        <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 mt-2">
                            GET /api/gdpr/export
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Requires your Agent API Key (Settings → Integrations).
                        </p>
                    </div>

                    <div className="rounded-lg border p-5 space-y-2">
                        <h3 className="font-medium">🗑️ Delete Client Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Permanently erase a client and all their associated data (Art. 17 — Right to Erasure).
                        </p>
                        <p className="text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 mt-2">
                            DELETE /api/gdpr/delete?clientId=xxx
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Requires your Agent API Key. This action is irreversible.
                        </p>
                    </div>
                </div>
            </section>

            {/* Data We Hold */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Data We Hold</h2>
                <div className="rounded-lg border divide-y text-sm">
                    {[
                        { category: "Client Information", data: "Name, email, address, phone, VAT number", retention: "Until deleted" },
                        { category: "Invoices & Quotes", data: "Line items, amounts, dates, status", retention: "Until deleted" },
                        { category: "Payments", data: "Amount, date, payment method", retention: "Until deleted" },
                        { category: "Expenses", data: "Description, amount, category, receipts", retention: "Until deleted" },
                        { category: "Audit Logs", data: "Action type, resource, timestamp", retention: "90 days" },
                        { category: "Settings", data: "Company info, API keys (encrypted at rest by Turso)", retention: "Until changed" },
                    ].map((row) => (
                        <div key={row.category} className="grid grid-cols-3 px-4 py-3 gap-4">
                            <span className="font-medium">{row.category}</span>
                            <span className="text-muted-foreground">{row.data}</span>
                            <span className="text-muted-foreground">{row.retention}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Security Measures */}
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Security Measures</h2>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>All data encrypted in transit (TLS 1.3) and at rest (Turso)</li>
                    <li>Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options</li>
                    <li>API endpoints protected by bearer token authentication</li>
                    <li>Rate limiting on all public API routes</li>
                    <li>Audit log records all data creation, modification, and deletion events</li>
                    <li>Cron jobs protected by secret token</li>
                </ul>
            </section>

            {/* Links */}
            <section className="flex gap-4 text-sm">
                <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
                    Privacy Policy
                </Link>
                <Link href="/settings" className="text-muted-foreground underline underline-offset-4">
                    ← Back to Settings
                </Link>
            </section>
        </div>
    );
}
