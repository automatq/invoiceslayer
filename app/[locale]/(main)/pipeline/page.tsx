import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { getPipelines, createDefaultPipeline } from "@/app/actions/deals";
import { getDealsWithRevenue } from "@/app/actions/deal-invoice-integration";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
    // Ensure default pipeline exists
    await createDefaultPipeline();
    
    const pipelines = await getPipelines();
    
    if (!pipelines || pipelines.length === 0) {
        return (
            <div className="flex-1 p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">No Pipeline Found</h2>
                    <p className="text-muted-foreground">Create your first pipeline to get started.</p>
                </div>
            </div>
        );
    }

    const defaultPipeline = pipelines.find((p: { isDefault: boolean }) => p.isDefault) || pipelines[0];
    
    // Get deals with invoice data
    const dealsWithRevenue = await getDealsWithRevenue();
    
    // Merge invoice data into pipeline deals
    const pipelineWithInvoices = {
        ...defaultPipeline,
        stages: defaultPipeline.stages.map(stage => ({
            ...stage,
            deals: stage.deals.map(deal => {
                const dealWithRevenue = dealsWithRevenue.find(d => d.id === deal.id);
                return {
                    ...deal,
                    invoices: dealWithRevenue?.invoices || [],
                    quotes: dealWithRevenue?.quotes || [],
                };
            }),
        })),
    };

    return (
        <div className="flex-1 h-full flex flex-col">
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pipeline CRM</h1>
                        <p className="text-muted-foreground">Manage your sales pipeline and track deals</p>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <PipelineBoard pipeline={pipelineWithInvoices} />
            </div>
        </div>
    );
}
