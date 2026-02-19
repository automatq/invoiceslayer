"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Stage {
    id: string;
    name: string;
    color: string;
    order: number;
    probability: number;
    deals: any[];
}

interface StageColumnProps {
    stage: Stage;
    children: React.ReactNode;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onAddDeal: () => void;
}

export function StageColumn({ stage, children, onDragOver, onDrop, onAddDeal }: StageColumnProps) {
    const totalValue = stage.deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

    return (
        <div
            className="flex flex-col w-80 min-w-80 max-w-80 h-full bg-muted/30 rounded-lg border"
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {/* Column Header */}
            <div className="p-4 border-b bg-background rounded-t-lg">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: stage.color }}
                        />
                        <h3 className="font-semibold">{stage.name}</h3>
                    </div>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {stage.deals.length}
                    </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stage.probability}% probability</span>
                    <span className="font-medium">${totalValue.toLocaleString()}</span>
                </div>
            </div>

            {/* Deals Container */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {children}
            </div>

            {/* Add Deal Button */}
            <div className="p-3 border-t">
                <Button
                    variant="ghost"
                    className="w-full justify-center text-muted-foreground hover:text-foreground"
                    onClick={onAddDeal}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deal
                </Button>
            </div>
        </div>
    );
}
