import { checkAndSendReminders } from "@/app/actions/reminders";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        // Logic to verify auth header if needed

        const result = await checkAndSendReminders();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
