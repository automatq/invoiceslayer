"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createDeal } from "@/app/actions/deals";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getClients } from "@/app/actions/clients";
import { useEffect } from "react";

interface Stage {
    id: string;
    name: string;
}

interface Client {
    id: string;
    name: string;
    email: string;
}

const CreateDealSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    value: z.string().min(1, "Value is required"),
    clientId: z.string().min(1, "Client is required"),
    stageId: z.string().min(1, "Stage is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    source: z.string(),
    expectedClose: z.string(),
});

type CreateDealFormData = z.infer<typeof CreateDealSchema>;

interface CreateDealDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stages: Stage[];
    defaultStageId: string | null;
    pipelineId: string;
}

export function CreateDealDialog({ open, onOpenChange, stages, defaultStageId, pipelineId }: CreateDealDialogProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateDealFormData>({
        resolver: zodResolver(CreateDealSchema),
        defaultValues: {
            title: "",
            description: "",
            value: "",
            clientId: "",
            stageId: defaultStageId || stages[0]?.id || "",
            priority: "MEDIUM",
            source: "",
            expectedClose: "",
        },
    });

    // Update stageId when defaultStageId changes
    useEffect(() => {
        if (defaultStageId) {
            form.setValue("stageId", defaultStageId);
        }
    }, [defaultStageId, form]);

    // Load clients
    useEffect(() => {
        if (open) {
            getClients().then(setClients);
        }
    }, [open]);

    const onSubmit = async (values: CreateDealFormData) => {
        setIsLoading(true);
        try {
            const result = await createDeal({
                title: values.title,
                description: values.description,
                value: parseFloat(values.value),
                currency: "USD",
                clientId: values.clientId,
                pipelineId: pipelineId,
                stageId: values.stageId,
                priority: values.priority,
                source: values.source,
                expectedClose: values.expectedClose,
            });

            if (result.success) {
                toast.success("Deal created successfully");
                onOpenChange(false);
                form.reset();
            } else {
                toast.error(result.message || "Failed to create deal");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Deal</DialogTitle>
                    <DialogDescription>
                        Add a new deal to your pipeline.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deal Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Website Redesign Project" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deal Value</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="25000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="LOW">Low</SelectItem>
                                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                                <SelectItem value="HIGH">High</SelectItem>
                                                <SelectItem value="URGENT">Urgent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a client" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="stageId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stage</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a stage" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {stages.map((stage) => (
                                                <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Source</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Website, Referral..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="expectedClose"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Expected Close</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Additional details about the deal..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Deal"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
