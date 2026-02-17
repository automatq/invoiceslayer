
import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./lib/prisma";
import { generateApiKey } from "./app/actions/api-keys";

async function main() {
    console.log("Starting Crypto Payment API Verification...");

    // 1. Get/Generate API Key
    console.log("Ensuring API Key...");
    const keyResult = await generateApiKey();
    if (!keyResult.success || !keyResult.apiKey) {
        console.error("Failed to generate API Key");
        process.exit(1);
    }
    const API_KEY = keyResult.apiKey;

    const BASE_URL = "http://localhost:3000/api/v1/agent";

    // 2. Create a specific test client and invoice directly via Prisma (faster setup)
    console.log("\nSetting up test data...");
    const client = await prisma.client.create({
        data: { name: "Crypto Test Client", email: "crypto@test.com" }
    });

    const invoice = await prisma.invoice.create({
        data: {
            number: `CRYPTO-${Date.now()}`,
            date: new Date(),
            dueDate: new Date(),
            clientId: client.id,
            status: "SENT",
            total: 100,
            items: {
                create: [{ description: "Test Item", quantity: 1, unitPrice: 100, amount: 100 }]
            }
        }
    });
    console.log(`Created Invoice: ${invoice.number} (Status: ${invoice.status})`);

    // 3. Test PATCH endpoint
    console.log("\nTesting PATCH /invoices (Mark as PAID)...");

    const res = await fetch(`${BASE_URL}?resource=invoices`, {
        method: "PATCH",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: invoice.id,
            status: "PAID"
        })
    });

    if (res.status === 200) {
        const updated = await res.json();
        console.log(`✅ API response status: ${updated.status}`);

        if (updated.status === "PAID") {
            console.log("✅ Verification PASSED: Invoice marked as PAID by Agent.");
        } else {
            console.error("❌ Verification FAILED: Invoice status not updated.");
        }
    } else {
        console.error(`❌ API Request Failed: ${res.status}`);
        console.error(await res.text());
    }

    // Cleanup
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.client.delete({ where: { id: client.id } });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
