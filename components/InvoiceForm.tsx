"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createInvoice, updateInvoice } from "@/app/actions/invoices";
import { getProjects } from "@/app/actions/projects";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";

const InvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    taxRate: z.number().min(0).max(100),
});

const InvoiceSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    projectId: z.string().optional(),
    date: z.date(),
    dueDate: z.date(),
    items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
    enableEscrow: z.boolean(),
    escrowPlatform: z.string().optional(),
    escrowResourceId: z.string().optional(),
    escrowCondition: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof InvoiceSchema>;

export function InvoiceForm({
    clients,
    initialData,
    defaultTaxRate = 13,
    searchParams
}: {
    clients: { id: string; name: string }[];
    initialData?: any;
    defaultTaxRate?: number;
    searchParams?: { [key: string]: string | string[] | undefined };
}) {
    const router = useRouter();

    const prefilledAmount = searchParams?.amount ? parseFloat(searchParams.amount as string) : 0;
    const prefilledDescription = prefilledAmount > 0 ? "Services" : "";

    const [projects, setProjects] = useState<any[]>([]);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(InvoiceSchema),
        defaultValues: {
            clientId: initialData?.clientId || "",
            projectId: initialData?.projectId || "",
            date: initialData ? new Date(initialData.date) : new Date(),
            dueDate: initialData ? new Date(initialData.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            items: initialData?.items?.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate ?? defaultTaxRate,
            })) || [{ description: prefilledDescription, quantity: 1, unitPrice: prefilledAmount, taxRate: defaultTaxRate }],
            enableEscrow: !!initialData?.escrowContract,
            escrowPlatform: initialData?.escrowContract?.platform || "FIGMA",
            escrowResourceId: initialData?.escrowContract?.resourceId || "",
            escrowCondition: initialData?.escrowContract?.condition || "APPROVED",
        },
    });

    const selectedClientId = watch("clientId");

    useEffect(() => {
        if (selectedClientId) {
            getProjects(selectedClientId).then(setProjects);
        } else {
            setProjects([]);
        }
    }, [selectedClientId]);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const items = watch("items");
    const subtotal = items.reduce((acc, item) => {
        return acc + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);
    const taxTotal = items.reduce((acc, item) => {
        const lineAmount = (item.quantity || 0) * (item.unitPrice || 0);
        return acc + lineAmount * ((item.taxRate || 0) / 100);
    }, 0);
    const total = subtotal + taxTotal;
    const onSubmit = async (data: InvoiceFormValues) => {
        try {
            const invoiceData = {
                ...data,
                escrow: data.enableEscrow ? {
                    platform: data.escrowPlatform || "FIGMA",
                    resourceId: data.escrowResourceId || "",
                    condition: data.escrowCondition || "APPROVED",
                } : undefined,
            };

            let result;
            if (initialData) {
                result = await updateInvoice(initialData.id, invoiceData);
            } else {
                result = await createInvoice(invoiceData);
            }

            if (result.success) {
                toast.success(initialData ? "Invoice updated" : "Invoice created", {
                    description: "You have been redirected to the invoices list.",
                });
                router.push("/invoices");
                router.refresh();
            } else {
                toast.error("Failed to save invoice", {
                    description: result.message || "Please check your inputs and try again.",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        }
    };


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                    <CardDescription>General information about the invoice.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                            onValueChange={(value) => setValue("clientId", value)}
                            defaultValue={initialData?.clientId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register("clientId")} />
                        {errors.clientId && (
                            <p className="text-xs text-red-500">{errors.clientId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Project (Optional)</Label>
                        <Select
                            onValueChange={(value) => setValue("projectId", value)}
                            defaultValue={initialData?.projectId}
                            value={watch("projectId")}
                            disabled={!selectedClientId || projects.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={projects.length === 0 ? "No projects found" : "Select a project"} />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" {...register("projectId")} />
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <DatePicker
                            date={watch("date")}
                            setDate={(date) => setValue("date", date as Date)}
                        />
                        {errors.date && (
                            <p className="text-xs text-red-500">{errors.date.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <DatePicker
                            date={watch("dueDate")}
                            setDate={(date) => setValue("dueDate", date as Date)}
                        />
                        {errors.dueDate && (
                            <p className="text-xs text-red-500">{errors.dueDate.message}</p>
                        )}
                    </div>

                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0.5">
                        <CardTitle>Smart Escrow</CardTitle>
                        <CardDescription>
                            Hold funds in escrow until AI verifies a condition.
                        </CardDescription>
                    </div>
                    <Switch
                        checked={watch("enableEscrow")}
                        onCheckedChange={(checked) => setValue("enableEscrow", !!checked)}
                    />
                </CardHeader>
                {watch("enableEscrow") && (
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Platform</Label>
                            <Select
                                onValueChange={(value) => setValue("escrowPlatform", value)}
                                defaultValue={watch("escrowPlatform")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="FIGMA">Figma</SelectItem>
                                    <SelectItem value="GITHUB">GitHub</SelectItem>
                                    <SelectItem value="DRIBBBLE">Dribbble</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Resource URL / ID</Label>
                            <Input
                                {...register("escrowResourceId")}
                                placeholder="e.g., https://figma.com/file/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Condition</Label>
                            <Select
                                onValueChange={(value) => setValue("escrowCondition", value)}
                                defaultValue={watch("escrowCondition")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="APPROVED">File Approved</SelectItem>
                                    <SelectItem value="MERGED">PR Merged</SelectItem>
                                    <SelectItem value="PUBLISHED">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Line Items</CardTitle>
                    <InteractiveButton
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: defaultTaxRate })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </InteractiveButton>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Column Headers */}
                    {/* Column Headers */}
                    <div className="hidden sm:grid gap-4 sm:grid-cols-[3fr_1fr_1fr_1fr_1fr_min-content] text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div>Description</div>
                        <div>Qty</div>
                        <div>Price</div>
                        <div>Tax %</div>
                        <div className="text-right">Amount</div>
                        <div></div>
                    </div>
                    {fields.map((field, index) => {
                        const qty = items[index]?.quantity || 0;
                        const price = items[index]?.unitPrice || 0;
                        const tax = items[index]?.taxRate || 0;
                        const lineAmount = qty * price;
                        const lineTax = lineAmount * (tax / 100);
                        return (
                            <div key={field.id} className="grid gap-4 sm:grid-cols-[3fr_1fr_1fr_1fr_1fr_min-content] items-start">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground sm:hidden">Description</Label>
                                    <Input
                                        {...register(`items.${index}.description`)}
                                        placeholder="Item description"
                                    />
                                    {errors.items?.[index]?.description && (
                                        <p className="text-xs text-red-500">{errors.items[index]?.description?.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground sm:hidden">Qty</Label>
                                    <Input
                                        type="number"
                                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground sm:hidden">Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground sm:hidden">Tax %</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="pt-2 text-right space-y-1">
                                    <div className="text-sm font-medium">${lineAmount.toFixed(2)}</div>
                                    {tax > 0 && (
                                        <div className="text-xs text-muted-foreground">+${lineTax.toFixed(2)} tax</div>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => remove(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
                <Separator />
                <CardFooter className="flex justify-end py-4">
                    <div className="space-y-1 text-right">
                        <div className="text-sm text-muted-foreground">Subtotal: ${subtotal.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Tax: ${taxTotal.toFixed(2)}</div>
                        <div className="text-xl font-bold">Total: ${total.toFixed(2)}</div>
                    </div>
                </CardFooter>
            </Card>

            <div className="flex justify-end">
                <InteractiveButton type="submit" loading={isSubmitting}>
                    {initialData ? "Update Invoice" : "Create Invoice"}
                </InteractiveButton>
            </div>
        </form >
    );
}
