import { CalendarView } from "@/components/CalendarView";
import { getCalendarEvents } from "@/app/actions/calendar";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Calendar | InvoiceMaster",
    description: "Financial calendar overview",
};

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
    const events = await getCalendarEvents(new Date());

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-full flex flex-col">
            <CalendarView events={events} />
        </div>
    );
}
