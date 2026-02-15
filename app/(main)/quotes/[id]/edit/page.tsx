import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/QuoteForm";
import { getClients } from "@/app/actions/clients";
import { getQuote } from "@/app/actions/quotes";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [quote, clients] = await Promise.all([
        getQuote(id),
        getClients(),
    ]);

    if (!quote) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/quotes/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Quote</h1>
                    <p className="text-muted-foreground">
                        Update details for Quote {quote.number}
                    </p>
                </div>
            </div>
            <div className="mx-auto max-w-2xl">
                <QuoteForm clients={clients} initialData={quote} />
            </div>
        </div>
    );
}
