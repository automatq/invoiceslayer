import { ClientForm } from "@/components/ClientForm";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
    return (
        <div className="max-w-4xl mx-auto w-full">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">New Client</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Add a new client to your database.
                </p>
            </div>
            <ClientForm />
        </div>
    );
}
