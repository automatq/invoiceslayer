"use server";

import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import { revalidatePath } from "next/cache";

export async function importExpenses(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, message: "No file provided" };
        }

        const text = await file.text();

        // Parse CSV
        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.toLowerCase().trim(),
        });

        if (parsed.errors.length > 0) {
            console.error("CSV Parse Errors:", parsed.errors);
            return { success: false, message: "Error parsing CSV file" };
        }

        const data = parsed.data as any[];
        let successCount = 0;
        let errorCount = 0;

        for (const row of data) {
            try {
                // Try to map common columns
                const dateStr = row.date || row.transaction_date || row.timestamp;
                const description = row.description || row.memo || row.name || row.payee || "Imported Expense";

                // Handle amount variations
                let amountStr = row.amount || row.debit || row.value;
                if (!amountStr && row.credit && parseFloat(row.credit) < 0) {
                    amountStr = row.credit; // Handle negative credits as debits if structured that way
                }

                if (!dateStr || !amountStr) {
                    console.log("Skipping row due to missing date or amount:", row);
                    errorCount++;
                    continue;
                }

                // Clean up amount string
                amountStr = amountStr.toString().replace(/[^0-9.-]/g, "");
                const amount = parseFloat(amountStr);

                // For expenses, we usually expect positive numbers in the DB, 
                // but bank CSVs often show debits as negative. 
                // Let's ensure we store it as a positive expense amount.
                // If the user uploads a credit (refund), effective logic might need to be smarter, 
                // but for "Expenses", absolute value is a safe bet for v0.
                const finalAmount = Math.abs(amount);

                if (isNaN(finalAmount) || finalAmount === 0) {
                    errorCount++;
                    continue;
                }

                // Create expense
                await prisma.expense.create({
                    data: {
                        date: new Date(dateStr),
                        description: description,
                        amount: finalAmount,
                        category: "Uncategorized", // Default category
                    },
                });

                successCount++;
            } catch (e) {
                console.error("Error importing row:", row, e);
                errorCount++;
            }
        }

        revalidatePath("/expenses");
        return {
            success: true,
            message: `Imported ${successCount} expenses. ${errorCount > 0 ? `Skipped ${errorCount} invalid rows.` : ""}`
        };

    } catch (e: any) {
        console.error("Import error:", e);
        return { success: false, message: e.message || "Failed to import expenses" };
    }
}
