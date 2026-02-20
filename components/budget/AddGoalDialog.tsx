"use client";

import { useState } from "react";
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
import { createFinancialGoal } from "@/app/actions/budget";
import { toast } from "sonner";

interface AddGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [type, setType] = useState<"REVENUE" | "PROFIT">("REVENUE");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(
        new Date(new Date().getFullYear(), 11, 31).toISOString().split("T")[0]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !targetAmount) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        const result = await createFinancialGoal({
            name,
            targetAmount: parseFloat(targetAmount),
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
        });

        if (result.success) {
            toast.success("Financial goal created!");
            onOpenChange(false);
            // Reset form
            setName("");
            setTargetAmount("");
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set New Financial Goal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Goal Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., 2024 Revenue Target"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Target Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REVENUE">Revenue</SelectItem>
                                    <SelectItem value="PROFIT">Net Profit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="target">Target Amount ($)</Label>
                            <Input
                                id="target"
                                type="number"
                                placeholder="50000"
                                value={targetAmount}
                                onChange={(e) => setTargetAmount(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Set Goal"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
