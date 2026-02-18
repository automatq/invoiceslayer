import { processRecurringInvoices } from "@/app/actions/recurring";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = request.headers.get("authorization");

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await processRecurringInvoices();
        return NextResponse.json({ success: true, processed: result.processed });
    } catch (error) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
