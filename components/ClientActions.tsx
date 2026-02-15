"use client";

import { deleteClient } from "@/app/actions/clients";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, FileText, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface ClientActionsProps {
    id: string;
}

export function ClientActions({ id }: ClientActionsProps) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
            const result = await deleteClient(id);
            if (result.success) {
                toast.success("Client deleted");
                router.push("/clients");
            } else {
                toast.error("Failed to delete client");
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/clients/${id}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/clients/${id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Client
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleDelete}
                >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
