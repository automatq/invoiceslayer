"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
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
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purgeAllData } from "@/app/actions/settings";

export function PurgeDataAction() {
    const router = useRouter();
    const [confirmText, setConfirmText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handlePurge = async () => {
        if (confirmText !== "PURGE") return;

        setIsLoading(true);
        try {
            const result = await purgeAllData();
            if (result.success) {
                toast.success("All application data has been purged.");
                setIsOpen(false);
                setConfirmText("");
                router.push("/");
                router.refresh();
            } else {
                toast.error("Purge failed", { description: result.message });
            }
        } catch (error) {
            toast.error("An unexpected error occurred during purge.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <InteractiveButton variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Purge All Data
                </InteractiveButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Extreme Warning: Irreversible Action
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4 pt-2 text-muted-foreground">
                            <p>
                                This will **permanently delete** all clients, invoices, quotes, payments,
                                expenses, and notifications. This action cannot be undone.
                            </p>
                            <p className="font-semibold text-foreground">
                                Your account and company settings will be preserved.
                            </p>
                            <div className="space-y-2 border-t pt-4">
                                <Label htmlFor="confirm-purge" className="text-sm font-medium">
                                    Type <span className="font-bold text-destructive">PURGE</span> to confirm:
                                </Label>
                                <Input
                                    id="confirm-purge"
                                    placeholder="PURGE"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    className="border-destructive/30 focus-visible:ring-destructive"
                                />
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <InteractiveButton
                            onClick={(e) => {
                                e.preventDefault();
                                handlePurge();
                            }}
                            disabled={confirmText !== "PURGE" || isLoading}
                            variant="destructive"
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground min-w-[100px]"
                        >
                            {isLoading ? "Purging..." : "Delete Everything"}
                        </InteractiveButton>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
