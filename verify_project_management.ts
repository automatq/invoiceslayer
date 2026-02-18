import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function verify() {
    console.log('Starting verification...');

    try {
        // 0. Get a test user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("No user found in database. Please register a user first.");
            process.exit(1);
        }
        const userId = user.id;

        // 1. Create a Client
        console.log('Creating client...');
        const client = await prisma.client.create({
            data: {
                name: 'Test Client Project Mgmt',
                email: 'test@projectmgmt.com',
                userId
            },
        });
        console.log('Client created:', client.id);

        // 2. Create a Project
        console.log('Creating project...');
        const project = await prisma.project.create({
            data: {
                name: 'Test Project Alpha',
                description: 'A test project for verification',
                clientId: client.id,
                status: 'ACTIVE',
                userId
            },
        });
        console.log('Project created:', project.id);

        // 3. Create an Invoice linked to Project
        console.log('Creating invoice linked to project...');
        const invoice = await prisma.invoice.create({
            data: {
                number: 'INV-TEST-PROJ-001',
                clientId: client.id,
                projectId: project.id, // Link to project
                userId,
                date: new Date(),
                dueDate: new Date(),
                status: 'DRAFT',
                items: {
                    create: [
                        { description: 'Project Work', quantity: 10, unitPrice: 100, amount: 1000 },
                    ],
                },
                total: 1000,
            },
            include: { project: true },
        });

        if (invoice.projectId === project.id) {
            console.log('✅ Invoice linked to project successfully');
        } else {
            console.error('❌ Invoice NOT linked to project');
        }

        // 4. Create a Quote linked to Project
        console.log('Creating quote linked to project...');
        const quote = await prisma.quote.create({
            data: {
                number: 'EST-TEST-PROJ-001',
                clientId: client.id,
                projectId: project.id, // Link to project
                userId,
                date: new Date(),
                expiryDate: new Date(),
                status: 'DRAFT',
                items: {
                    create: [
                        { description: 'Project Work Quote', quantity: 10, unitPrice: 100, amount: 1000 }
                    ]
                },
                subtotal: 1000,
                total: 1000
            },
            include: { project: true }
        });

        if (quote.projectId === project.id) {
            console.log('✅ Quote linked to project successfully');
        } else {
            console.error('❌ Quote NOT linked to project');
        }

        // 5. Create an Expense linked to Project
        console.log('Creating expense linked to project...');
        const expense = await prisma.expense.create({
            data: {
                description: 'Project Supplies',
                amount: 50.00,
                date: new Date(),
                category: 'Materials',
                projectId: project.id, // Link to project
                userId
            },
            include: { project: true }
        });

        if (expense.projectId === project.id) {
            console.log('✅ Expense linked to project successfully');
        } else {
            console.error('❌ Expense NOT linked to project');
        }

        // Clean up
        console.log('Cleaning up...');
        await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
        await prisma.invoice.delete({ where: { id: invoice.id } });
        await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
        await prisma.quote.delete({ where: { id: quote.id } });
        await prisma.expense.delete({ where: { id: expense.id } });
        await prisma.project.delete({ where: { id: project.id } });
        await prisma.client.delete({ where: { id: client.id } });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
