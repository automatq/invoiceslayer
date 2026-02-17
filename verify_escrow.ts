
import { prisma } from "./lib/prisma";
import { createInvoice } from "./app/actions/invoices";

async function verifyEscrowFlow() {
    console.log("🚀 Starting Smart Escrow Verification...");

    try {
        // 1. Setup: Get a user and client
        let user = await prisma.user.findFirst();
        if (!user) {
            console.log("⚠️ No user found. Creating test user...");
            user = await prisma.user.create({
                data: {
                    email: "testuser@example.com",
                    password: "password123", // In real app should be hashed, but fine for test script
                    name: "Test User"
                }
            });
            console.log("✅ Created test user");
        }

        const client = await prisma.client.findFirst();
        if (!client) {
            console.error("❌ No client found. Please create a client.");
            // Create a dummy client if none exists for the test
            const newClient = await prisma.client.create({
                data: {
                    name: "Test Client",
                    email: "test@example.com",
                    address: "123 Test St",
                    phone: "123-456-7890"
                }
            });
            console.log("✅ Created test client");
        }

        const finalClient = await prisma.client.findFirst();
        if (!finalClient) { throw new Error("Client creation failed"); }

        const setting = await prisma.setting.findFirst();
        // Fallback to env var or a known test key if database setting is missing for dev
        const agentKey = setting?.agentApiKey || process.env.AGENT_API_KEY;

        if (!agentKey) {
            console.error("❌ No Agent API Key found in Settings or ENV.");
            // Generate one temporarily for the test if needed? 
            // Better to fail and ask user to set it up if it's missing.
            return;
        }

        // 2. Create an Invoice with Escrow (Using Prisma directly to avoid revalidatePath issues in script)
        console.log("📝 Creating Invoice with Escrow...");

        // Generate a number
        const count = await prisma.invoice.count();
        const number = `TEST-ESCROW-${Date.now()}`;

        const invoice = await prisma.invoice.create({
            data: {
                number,
                clientId: finalClient.id,
                date: new Date(),
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: "DRAFT",
                items: {
                    create: [{ description: "Escrow Test Service", quantity: 1, unitPrice: 5000, amount: 5000 }]
                },
                total: 5000,
                escrowContract: {
                    create: {
                        platform: "GITHUB",
                        resourceId: "https://github.com/automatq/invoicemaster/pull/123",
                        condition: "MERGED",
                        amount: 5000,
                        status: "PENDING"
                    }
                }
            }
        });

        const invoiceId = invoice.id;
        console.log(`✅ Invoice created: ${invoiceId}`);

        // 3. Verify Escrow Created PENDING
        const escrow = await prisma.escrowContract.findUnique({
            where: { invoiceId }
        });

        if (!escrow || escrow.status !== "PENDING") {
            console.error("❌ Escrow contract not found or not PENDING:", escrow);
            return;
        }
        console.log(`✅ Escrow Contract verified: ${escrow.platform} -> ${escrow.condition} [${escrow.status}]`);


        // 4. Simulate Agent API Release
        console.log("🤖 Agent releasing funds via API...");
        const apiUrl = "http://localhost:3000/api/v1/agent?resource=escrow";

        const response = await fetch(apiUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${agentKey}`
            },
            body: JSON.stringify({
                invoiceId: invoiceId,
                status: "RELEASED"
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ Agent API failed: ${response.status} - ${err}`);
            return;
        }

        const updatedEscrowFromApi = await response.json();
        console.log("✅ Agent API response received.", updatedEscrowFromApi);

        // 5. Final Verification
        const finalEscrow = await prisma.escrowContract.findUnique({
            where: { invoiceId }
        });

        if (finalEscrow?.status === "RELEASED") {
            console.log("🎉 SUCCESS: Escrow funds released!");
        } else {
            console.error("❌ FAILURE: Escrow status mismatch:", finalEscrow);
        }

    } catch (error) {
        console.error("❌ Verification failed with error:", error);
    }
}

verifyEscrowFlow();
