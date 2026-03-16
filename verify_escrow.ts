import { prisma } from "./lib/prisma";

async function verifyEscrowFlow() {
  console.log("Starting Smart Escrow Verification...");

  try {
    // 1. Verify database connectivity
    const userCount = await prisma.user.count();
    console.log(`Database connected. Users: ${userCount}`);

    const clientCount = await prisma.client.count();
    console.log(`Clients: ${clientCount}`);

    const invoiceCount = await prisma.invoice.count();
    console.log(`Invoices: ${invoiceCount}`);

    // 2. Verify a client exists or create one
    let client = await prisma.client.findFirst();
    if (!client) {
      console.log("No client found. Creating test client...");
      client = await prisma.client.create({
        data: {
          name: "Test Client",
          email: "test@example.com",
          address: "123 Test St",
          phone: "123-456-7890",
        },
      });
      console.log(`Created test client: ${client.id}`);
    }

    // 3. Create a test invoice
    console.log("Creating test invoice...");
    const number = `TEST-${Date.now()}`;

    const invoice = await prisma.invoice.create({
      data: {
        number,
        clientId: client.id,
        date: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: "DRAFT",
        total: 5000,
        items: {
          create: [
            {
              description: "Test Service",
              quantity: 1,
              unitPrice: 5000,
              amount: 5000,
            },
          ],
        },
      },
      include: { items: true },
    });

    console.log(`Invoice created: ${invoice.id} (${invoice.number})`);
    console.log(`  Items: ${invoice.items.length}`);
    console.log(`  Total: $${invoice.total}`);

    // 4. Clean up test data
    await prisma.invoice.delete({ where: { id: invoice.id } });
    console.log("Test invoice cleaned up.");

    console.log("Verification complete!");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

verifyEscrowFlow();
