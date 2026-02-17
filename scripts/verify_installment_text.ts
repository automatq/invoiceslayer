
import { processRecurringInvoices } from "./app/actions/recurring";
import { prisma } from "./lib/prisma";

async function verify() {
    console.log("Forcing recurring invoice to be due...");

    // 1. Force the recurring invoice to be due
    await prisma.recurringInvoice.update({
        where: { id: "cmlpkk0x8000545s86kvrvag8" },
        data: {
            nextRunDate: new Date("2020-01-01"), // Past date to ensure it runs
            currentOccurrence: 0 // Reset to 0 so it generates Installment 1
        }
    });

    console.log("Processing recurring invoices...");
    const result = await processRecurringInvoices();
    console.log("Result:", result);

    // 2. Fetch the latest invoice to check the description
    const latestInvoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: "desc" },
        include: { items: true }
    });

    console.log("\n--- Generated Invoice Item Description ---");
    latestInvoice?.items.forEach(item => {
        console.log(`- ${item.description}`);
    });
}

verify()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
