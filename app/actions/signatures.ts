"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PDFDocument } from "pdf-lib";
import { createNotification } from "@/app/actions/notifications";
import { logAuditEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";
import crypto from "crypto";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

function hashDocument(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
}

export async function saveSignature(data: {
    documentId: string;
    documentType: "INVOICE" | "QUOTE" | "CONTRACT";
    signatureData: string;
    clientId: string;
    metadata?: { name?: string; title?: string; company?: string };
}) {
    const { userId } = await getRequiredSession();
    
    try {
        // Get document PDF for hashing
        let documentContent = "";
        if (data.documentType === "INVOICE") {
            const invoice = await prisma.invoice.findUnique({
                where: { id: data.documentId, userId },
                include: { client: true, items: true }
            });
            if (invoice) {
                documentContent = JSON.stringify(invoice);
            }
        } else if (data.documentType === "QUOTE") {
            const quote = await prisma.quote.findUnique({
                where: { id: data.documentId, userId },
                include: { client: true, items: true }
            });
            if (quote) {
                documentContent = JSON.stringify(quote);
            }
        }

        const documentHash = hashDocument(documentContent);

        const signature = await prisma.documentSignature.create({
            data: {
                documentId: data.documentId,
                documentType: data.documentType,
                clientId: data.clientId,
                signatureData: data.signatureData,
                documentHash,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            }
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "DocumentSignature",
            resourceId: signature.id,
            userId,
            metadata: { 
                documentId: data.documentId,
                documentType: data.documentType,
                clientId: data.clientId
            }
        });

        await createNotification({
            type: "SUCCESS",
            title: "Document Signed",
            message: `A ${data.documentType.toLowerCase()} has been signed by a client`,
            link: data.documentType === "INVOICE" 
                ? `/invoices/${data.documentId}` 
                : `/quotes/${data.documentId}`,
            userId
        });

        revalidatePath(`/invoices/${data.documentId}`);
        revalidatePath(`/quotes/${data.documentId}`);
        
        return { success: true, signatureId: signature.id };
    } catch (error) {
        console.error("Failed to save signature:", error);
        return { success: false, message: "Failed to save signature" };
    }
}

export async function getDocumentSignature(documentId: string, documentType: string) {
    const { userId } = await getRequiredSession();
    
    try {
        const signature = await prisma.documentSignature.findFirst({
            where: {
                documentId,
                documentType,
            },
            include: {
                client: {
                    select: {
                        name: true,
                        email: true,
                    }
                }
            },
            orderBy: {
                signedAt: "desc"
            }
        });

        return signature;
    } catch (error) {
        console.error("Failed to get signature:", error);
        return null;
    }
}

export async function signDocumentViaPortal(
    documentId: string,
    documentType: "INVOICE" | "QUOTE" | "CONTRACT",
    signatureData: string,
    token: string,
    metadata?: { name?: string; title?: string; company?: string }
) {
    if (!token) return { success: false, message: "Invalid token" };

    const client = await prisma.client.findUnique({
        where: { portalToken: token }
    });

    if (!client) {
        return { success: false, message: "Client not found" };
    }

    // Verify client has access to this document
    let document;
    if (documentType === "INVOICE") {
        document = await prisma.invoice.findFirst({
            where: { id: documentId, clientId: client.id }
        });
    } else if (documentType === "QUOTE") {
        document = await prisma.quote.findFirst({
            where: { id: documentId, clientId: client.id }
        });
    }

    if (!document) {
        return { success: false, message: "Document not found" };
    }

    try {
        // Get headers for audit
        const headersList = await import("next/headers").then(mod => mod.headers());
        const ipAddress = headersList.get("x-forwarded-for") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        // Get document content for hashing
        let documentContent = JSON.stringify(document);
        const documentHash = hashDocument(documentContent);

        const signature = await prisma.documentSignature.create({
            data: {
                documentId,
                documentType,
                clientId: client.id,
                signatureData,
                documentHash,
                ipAddress,
                userAgent,
                metadata: metadata ? JSON.stringify(metadata) : null,
            }
        });

        await logAuditEvent({
            action: "CREATE",
            resource: "DocumentSignature",
            resourceId: signature.id,
            userId: client.userId,
            metadata: { 
                documentId,
                documentType,
                clientId: client.id,
                signedVia: "PORTAL",
                ipAddress
            }
        });

        await createNotification({
            type: "SUCCESS",
            title: "Document Signed via Portal",
            message: `${client.name} signed ${documentType.toLowerCase()} via client portal`,
            link: documentType === "INVOICE" 
                ? `/invoices/${documentId}` 
                : `/quotes/${documentId}`,
            userId: client.userId
        });

        revalidatePath(`/portal/${token}`);
        
        return { success: true, signatureId: signature.id };
    } catch (error) {
        console.error("Failed to save signature:", error);
        return { success: false, message: "Failed to save signature" };
    }
}

export async function generateSignedPDF(documentId: string, documentType: string) {
    const { userId } = await getRequiredSession();
    
    try {
        const signature = await prisma.documentSignature.findFirst({
            where: { documentId, documentType },
            include: { client: true },
            orderBy: { signedAt: "desc" }
        });

        if (!signature) {
            return { success: false, message: "No signature found" };
        }

        // Fetch original PDF
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/${documentType.toLowerCase()}s/${documentId}/pdf`);
        const pdfBytes = await response.arrayBuffer();

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];

        // Add signature image to last page
        const signatureImage = await pdfDoc.embedPng(Buffer.from(signature.signatureData.split(",")[1], "base64"));
        const { width, height } = lastPage.getSize();
        
        lastPage.drawImage(signatureImage, {
            x: 50,
            y: 50,
            width: 200,
            height: 60,
        });

        // Add signature metadata
        lastPage.drawText(`Signed by: ${signature.client.name}`, {
            x: 50,
            y: 40,
            size: 10,
        });
        lastPage.drawText(`Date: ${new Date(signature.signedAt).toLocaleString()}`, {
            x: 50,
            y: 28,
            size: 10,
        });

        const signedPdfBytes = await pdfDoc.save();
        
        return { 
            success: true, 
            pdfBytes: Buffer.from(signedPdfBytes).toString("base64"),
            filename: `signed-${documentType.toLowerCase()}-${documentId}.pdf`
        };
    } catch (error) {
        console.error("Failed to generate signed PDF:", error);
        return { success: false, message: "Failed to generate signed PDF" };
    }
}
