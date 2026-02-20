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
import { Textarea } from "@/components/ui/textarea";
import { createProfitBucket, updateProfitBucket } from "@/app/actions/budget";
import { toast } from "sonner";

interface AddBucketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingBucket?: {
        id: string;
        name: string;
        percentage: number;
        description?: string | null;
    } | null;
    currentTotal: number;
}

export function AddBucketDialog({
    open,
    onOpenChange,
    editingBucket,
    currentTotal,
}: AddBucketDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        percentage: "",
        description: "",
    });

    useEffect(() => {
        if (editingBucket) {
            setFormData({
                name: editingBucket.name,
                percentage: editingBucket.percentage.toString(),
                description: editingBucket.description || "",
            });
        } else {
            setFormData({ name: "", percentage: "", description: "" });
        }
    }, [editingBucket, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const percentage = parseFloat(formData.percentage);

        if (isNaN(percentage) || percentage <= 0) {
            toast.error("Please enter a valid percentage");
            setLoading(false);
            return;
        }

        const data = {
            name: formData.name,
            percentage,
            description: formData.description || undefined,
        };

        const result = editingBucket
            ? await updateProfitBucket(editingBucket.id, data)
            : await createProfitBucket(data);

        if (result.success) {
            toast.success(editingBucket ? "Bucket updated" : "Bucket created");
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
                        {editingBucket ? "Edit Bucket" : "Add Profit Bucket"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., Tax, Operating Buffer"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="percentage">Percentage (%)</Label>
                        <Input
                            id="percentage"
                            type="number"
                            step="0.1"
                            placeholder="e.g., 30"
                            value={formData.percentage}
                            onChange={(e) =>
                                setFormData({ ...formData, percentage: e.target.value })
                            }
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Remaining available: {100 - (currentTotal - (editingBucket?.percentage || 0))}%
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="What is this bucket for?"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Bucket"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
