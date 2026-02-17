"use client";

import { useState } from "react";
import { MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { InteractiveButton } from "@/components/ui/interactive-button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteExpense } from "@/app/actions/expenses";

interface ExpenseActionsProps {
    expense: {
        id: string;
        description: string;
    };
}

export function ExpenseActions({ expense }: ExpenseActionsProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteExpense(expense.id);
            if (result.success) {
                toast.success("Expense deleted");
                router.refresh();
            } else {
                toast.error(result.message || "Failed to delete expense");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsDeleting(false);
            setShowDeleteAlert(false);
        }
    };

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <InteractiveButton variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </InteractiveButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onSelect={() => setShowDeleteAlert(true)}
                    >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the expense
                            "{expense.description}" from your records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <InteractiveButton
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDelete();
                                }}
                                className="bg-red-600 border-none hover:bg-red-700"
                                loading={isDeleting}
                            >
                                Delete
                            </InteractiveButton>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
