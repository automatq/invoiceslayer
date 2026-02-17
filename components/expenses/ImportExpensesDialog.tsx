"use client";

import { useState } from "react";
import { importExpenses } from "@/app/actions/importExpenses";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImportExpensesDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);

        try {
            const result = await importExpenses(formData);

            if (result.success) {
                toast.success("Import Successful", {
                    description: result.message,
                });
                setOpen(false);
                router.refresh();
            } else {
                toast.error("Import Failed", {
                    description: result.message,
                });
            }
        } catch (error) {
            toast.error("An error occurred during import");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Expenses from CSV</DialogTitle>
                    <DialogDescription>
                        Upload your bank statement CSV to check for transaction date, description, and amount.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Bank Statement (CSV)</Label>
                        <Input id="file" name="file" type="file" accept=".csv" required />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Expected columns: Date, Description, Amount
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import Expenses
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
