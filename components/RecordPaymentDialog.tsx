"use client";

import { useState } from "react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordPayment } from "@/app/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { DatePicker } from "@/components/DatePicker";

export function RecordPaymentDialog({ invoice }: {
    invoice: {
        id: string;
        number: string;
        total: number;
        amountPaid: number;
    }
}) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const remainingBalance = invoice.total - invoice.amountPaid;

    const [amount, setAmount] = useState(remainingBalance.toString());
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [method, setMethod] = useState("E-TRANSFER");
    const [notes, setNotes] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!date) {
            toast.error("Please select a date");
            setIsLoading(false);
            return;
        }

        try {
            const result = await recordPayment({
                invoiceId: invoice.id,
                amount: parseFloat(amount),
                date: date,
                method,
                notes,
            });

            if (result.success) {
                toast.success("Payment recorded");
                setOpen(false);
                router.refresh();
                // Reset form slightly but keep date/method
                setNotes("");
            } else {
                toast.error(result.message || "Failed to record payment");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <InteractiveButton variant="outline" size="sm">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                </InteractiveButton>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment for Invoice {invoice.number}. Remaining balance: ${remainingBalance.toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">
                                Date
                            </Label>
                            <div className="col-span-3">
                                <DatePicker date={date} onDateChange={setDate} />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="method" className="text-right">
                                Method
                            </Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                    <SelectItem value="E-TRANSFER">E-Transfer</SelectItem>
                                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="notes" className="text-right">
                                Notes
                            </Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <InteractiveButton type="submit" loading={isLoading}>
                            Save Payment
                        </InteractiveButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
