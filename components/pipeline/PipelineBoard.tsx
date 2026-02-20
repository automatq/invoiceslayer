"use client";

import { useState, useEffect } from "react";
import { StageColumn } from "./StageColumn";
import { DealCard } from "./DealCard";
import { CreateDealDialog } from "./CreateDealDialog";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { moveDeal } from "@/app/actions/deals";
import { toast } from "sonner";

interface Pipeline {
    id: string;
    name: string;
    stages: Stage[];
}

interface Stage {
    id: string;
    name: string;
    color: string;
    order: number;
    probability: number;
    deals: Deal[];
}

interface Invoice {
    id: string;
    number: string;
    status: string;
    total: number;
    amountPaid: number;
}

interface Quote {
    id: string;
    number: string;
    status: string;
    total: number;
}

interface Deal {
    id: string;
    title: string;
    description: string | null;
    value: number;
    currency: string;
    priority: string;
    status: string;
    expectedClose: Date | null;
    client: {
        id: string;
        name: string;
        email: string;
    };
    activities: {
        id: string;
        type: string;
        description: string;
        createdAt: Date;
    }[];
    invoices?: Invoice[];
    quotes?: Quote[];
}

interface PipelineBoardProps {
    pipeline: Pipeline;
}

export function PipelineBoard({ pipeline }: PipelineBoardProps) {
    const [stages, setStages] = useState<Stage[]>(pipeline.stages);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

    // Sync local state when server data changes (e.g., after creating a deal)
    useEffect(() => {
        setStages(pipeline.stages);
    }, [pipeline.stages]);

    // Calculate forecast
    const forecast = stages.reduce((acc, stage) => {
        const stageValue = stage.deals.reduce((sum, deal) => sum + deal.value, 0);
        return acc + (stageValue * stage.probability / 100);
    }, 0);

    const totalDeals = stages.reduce((acc, stage) => acc + stage.deals.length, 0);

    const handleDragStart = (e: React.DragEvent, dealId: string) => {
        e.dataTransfer.setData("dealId", dealId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData("dealId");

        if (!dealId) return;

        // Optimistic update
        const newStages = stages.map(stage => {
            if (stage.deals.find(d => d.id === dealId)) {
                return { ...stage, deals: stage.deals.filter(d => d.id !== dealId) };
            }
            if (stage.id === stageId) {
                const movedDeal = stages.flatMap(s => s.deals).find(d => d.id === dealId);
                if (movedDeal) return { ...stage, deals: [...stage.deals, movedDeal] };
            }
            return stage;
        });
        setStages(newStages);

        const result = await moveDeal(dealId, stageId);
        if (result.success) {
            toast.success("Deal moved successfully");
        } else {
            toast.error("Failed to move deal");
            // Revert on error
            setStages(pipeline.stages);
        }
    };

    const handleAddDeal = (stageId: string) => {
        setSelectedStageId(stageId);
        setIsCreateOpen(true);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header Stats */}
            <div className="px-6 py-4 border-b bg-muted/30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <div>
                            <p className="text-sm text-muted-foreground">Weighted Forecast</p>
                            <p className="text-2xl font-bold">${forecast.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-border" />
                    <div>
                        <p className="text-sm text-muted-foreground">Total Deals</p>
                        <p className="text-2xl font-bold">{totalDeals}</p>
                    </div>
                    <div className="flex-1" />
                    <Button onClick={() => handleAddDeal(stages[0]?.id)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Deal
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="h-full flex gap-4 p-6 min-w-max">
                    {stages.map((stage) => (
                        <StageColumn
                            key={stage.id}
                            stage={stage}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                            onAddDeal={() => handleAddDeal(stage.id)}
                        >
                            {stage.deals.map((deal) => (
                                <DealCard
                                    key={deal.id}
                                    deal={deal}
                                    stageColor={stage.color}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, deal.id)}
                                />
                            ))}
                        </StageColumn>
                    ))}
                </div>
            </div>

            <CreateDealDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                stages={stages}
                defaultStageId={selectedStageId}
                pipelineId={pipeline.id}
            />
        </div>
    );
}
