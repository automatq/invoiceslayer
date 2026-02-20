"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { AddBucketDialog } from "./AddBucketDialog";
import { deleteProfitBucket } from "@/app/actions/budget";
import { toast } from "sonner";

interface Bucket {
    id: string;
    name: string;
    percentage: number;
    description?: string | null;
}

interface BucketListProps {
    buckets: Bucket[];
    totalAllocated: number;
}

export function BucketList({ buckets, totalAllocated }: BucketListProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bucket?")) return;

        const result = await deleteProfitBucket(id);
        if (result.success) {
            toast.success("Bucket deleted");
        } else {
            toast.error(result.message);
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Manage Buckets</CardTitle>
                <Button size="sm" onClick={() => setIsAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bucket
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {buckets.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No buckets defined yet.
                        </p>
                    ) : (
                        buckets.map((bucket) => (
                            <div
                                key={bucket.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{bucket.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {bucket.percentage}%
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingBucket(bucket)}
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(bucket.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            <AddBucketDialog
                open={isAddOpen || !!editingBucket}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddOpen(false);
                        setEditingBucket(null);
                    }
                }}
                editingBucket={editingBucket}
                currentTotal={totalAllocated}
            />
        </Card>
    );
}
