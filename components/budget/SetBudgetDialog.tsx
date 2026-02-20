"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { upsertExpenseBudget } from "@/app/actions/budget";
import { toast } from "sonner";

interface SetBudgetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: string[];
    editingBudget?: { category: string; amount: number } | null;
}

export function SetBudgetDialog({
    open,
    onOpenChange,
    categories,
    editingBudget,
}: SetBudgetDialogProps) {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        if (editingBudget) {
            setCategory(editingBudget.category);
            setAmount(editingBudget.amount.toString());
        } else {
            setCategory("");
            setAmount("");
        }
    }, [editingBudget, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category) {
            toast.error("Please select a category");
            return;
        }

        setLoading(true);
        const result = await upsertExpenseBudget({
            category,
            amount: parseFloat(amount),
        });

        if (result.success) {
            toast.success("Budget updated");
            onOpenChange(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editingBudget ? `Edit ${category} Budget` : "Set Category Budget"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={category}
                            onValueChange={setCategory}
                            disabled={!!editingBudget}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monthly Budget Amount ($)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="e.g., 500"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Budget"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
