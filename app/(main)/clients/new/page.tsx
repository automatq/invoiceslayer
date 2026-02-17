import { ClientForm } from "@/components/ClientForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NewClientPage() {
    return (
        <div className="max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/clients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Client</h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Add a new client to your database.
                    </p>
                </div>
            </div>
            <ClientForm />
        </div>
    );
}
