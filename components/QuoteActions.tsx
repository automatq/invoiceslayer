"use client";

import { deleteQuote } from "@/app/actions/quotes";
import { convertQuoteToInvoice } from "@/app/actions/invoices";
import { sendQuoteEmail } from "@/app/actions/email";
import { getSettings } from "@/app/actions/settings";
import { getDocumentSignature } from "@/app/actions/signatures";
import { generateQuotePDF } from "@/lib/generatePdf";
import { toast } from "sonner";
import Link from "next/link";
import { FileDown, FileCheck, Trash, Pencil, Send } from "lucide-react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { useRouter } from "next/navigation";
import { useState } from "react";
// import { Quote } from "@prisma/client"; // Prisma types sometimes need full relation types, let's use any for now or specific
import { Quote, Client, QuoteItem } from "@prisma/client";

type QuoteWithRelations = Quote & { client: Client; items: QuoteItem[] };

export function QuoteActions({ quote }: { quote: QuoteWithRelations }) {
    const router = useRouter();
    const [isConverting, setIsConverting] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const generatePDF = async () => {
        const settings = await getSettings();
        const signature = await getDocumentSignature(quote.id, "QUOTE");
        generateQuotePDF(quote, settings, signature);
    };

    const handleConvert = async () => {
        setIsConverting(true);
        try {
            const result = await convertQuoteToInvoice(quote.id);
            if (result.success && result.invoiceId) {
                toast.success("Quote converted to invoice");
                router.push(`/invoices/${result.invoiceId}`);
            } else {
                toast.error("Failed to convert quote: " + result.message);
            }
        } catch (error) {
            toast.error("An error occurred during conversion");
        } finally {
            setIsConverting(false);
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this quote?")) {
            const result = await deleteQuote(quote.id);
            if (result.success) {
                toast.success("Quote deleted");
                router.push("/quotes");
            } else {
                toast.error("Failed to delete quote");
            }
        }
    };

    const handleSendEmail = async () => {
        setIsSending(true);
        const result = await sendQuoteEmail(quote.id);
        if (result.success) {
            toast.success("Quote sent!", { description: `Email sent to ${quote.client.email}` });
            router.refresh();
        } else {
            toast.error("Failed to send email", { description: result.message });
        }
        setIsSending(false);
    };

    return (
        <div className="flex gap-2">
            <InteractiveButton variant="outline" size="sm" asChild>
                <Link href={`/quotes/${quote.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </InteractiveButton>
            <InteractiveButton variant="outline" size="sm" onClick={generatePDF}>
                <FileDown className="mr-2 h-4 w-4" />
                PDF
            </InteractiveButton>
            <InteractiveButton variant="outline" size="sm" onClick={handleSendEmail} disabled={isSending}>
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send Email"}
            </InteractiveButton>
            <InteractiveButton
                variant="outline"
                size="sm"
                onClick={handleConvert}
                disabled={isConverting}
            >
                <FileCheck className="mr-2 h-4 w-4" />
                {isConverting ? "Converting..." : "Convert"}
            </InteractiveButton>
            <InteractiveButton
                variant="destructive"
                size="sm"
                onClick={handleDelete}
            >
                <Trash className="mr-2 h-4 w-4" />
            </InteractiveButton>
        </div>
    );
}
