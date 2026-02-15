import { getClients } from "@/app/actions/clients";
import { QuoteForm } from "@/components/QuoteForm";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
    const clients = await getClients();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Create Quote</h1>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
                <QuoteForm clients={clients} />
            </div>
        </div>
    );
}
