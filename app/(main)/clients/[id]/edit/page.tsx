import { ClientForm } from "@/components/ClientForm";
import { getClient } from "@/app/actions/clients";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/clients/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
                    <p className="text-muted-foreground">
                        Update information for {client.name}
                    </p>
                </div>
            </div>
            <ClientForm initialData={client} />
        </div>
    );
}
