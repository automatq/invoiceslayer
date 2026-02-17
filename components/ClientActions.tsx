"use client";

import { deleteClient } from "@/app/actions/clients";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, FileText, Pencil, Trash } from "lucide-react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ClientActionsProps {
    id: string;
}

export function ClientActions({ id }: ClientActionsProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleDelete = async () => {
        const result = await deleteClient(id);
        if (result.success) {
            toast.success("Client deleted");
            router.push("/clients");
        } else {
            toast.error(result.message || "Failed to delete client");
        }
        setOpen(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <InteractiveButton variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </InteractiveButton>
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
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the client
                        and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <InteractiveButton
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </InteractiveButton>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
