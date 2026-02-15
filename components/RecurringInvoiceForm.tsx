"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createRecurringInvoice, updateRecurringInvoice } from "@/app/actions/recurring";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";

const RecurringInvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    taxRate: z.number().min(0).max(100),
});

const RecurringInvoiceSchema = z.object({
    clientId: z.string().min(1, "Client is required"),
    nextRunDate: z.date(),
    frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    items: z.array(RecurringInvoiceItemSchema).min(1, "At least one item is required"),
    isActive: z.boolean(),
    notes: z.string().optional(),
});

type RecurringInvoiceFormValues = z.infer<typeof RecurringInvoiceSchema>;

export function RecurringInvoiceForm({
    clients,
    initialData,
    defaultTaxRate = 13
}: {
    clients: { id: string; name: string }[];
    initialData?: any;
    defaultTaxRate?: number
}) {
    const router = useRouter();

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<RecurringInvoiceFormValues>({
        resolver: zodResolver(RecurringInvoiceSchema),
        defaultValues: {
            clientId: initialData?.clientId || "",
            nextRunDate: initialData ? new Date(initialData.nextRunDate) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default tomorrow
            frequency: initialData?.frequency || "MONTHLY",
            isActive: initialData?.isActive ?? true,
            notes: initialData?.notes || "",
            items: initialData?.items ? (typeof initialData.items === 'string' ? JSON.parse(initialData.items) : initialData.items) : [{ description: "", quantity: 1, unitPrice: 0, taxRate: defaultTaxRate }],
        },
    });

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

    const onSubmit = async (data: RecurringInvoiceFormValues) => {
        try {
            const formattedData = {
                ...data,
                nextRunDate: data.nextRunDate,
            };

            let result;
            if (initialData) {
                result = await updateRecurringInvoice(initialData.id, formattedData);
            } else {
                result = await createRecurringInvoice(formattedData);
            }

            if (result.success) {
                toast.success(initialData ? "Recurring invoice updated" : "Recurring invoice created", {
                    description: "You have been redirected to the recurring invoices list.",
                });
                router.push("/recurring");
                router.refresh();
            } else {
                toast.error("Failed to save recurring invoice", {
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
                    <CardTitle>Recurring Settings</CardTitle>
                    <CardDescription>Setup the schedule for this invoice.</CardDescription>
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
                        {errors.clientId && (
                            <p className="text-xs text-red-500">{errors.clientId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Next Run Date</Label>
                        <DatePicker
                            date={watch("nextRunDate")}
                            setDate={(date) => setValue("nextRunDate", date as Date)}
                        />
                        {errors.nextRunDate && (
                            <p className="text-xs text-red-500">{errors.nextRunDate.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select
                            onValueChange={(value: any) => setValue("frequency", value)}
                            defaultValue={watch("frequency")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.frequency && (
                            <p className="text-xs text-red-500">{errors.frequency.message}</p>
                        )}
                    </div>

                    <div className="space-y-2 flex items-center gap-2 pt-6">
                        <Label>Active Status</Label>
                        <Switch
                            checked={watch("isActive")}
                            onCheckedChange={(checked) => setValue("isActive", checked)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Template Items</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: defaultTaxRate })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
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

            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Input {...register("notes")} placeholder="Internal notes..." />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting}>
                    {initialData ? "Update Recurring Invoice" : "Create Recurring Invoice"}
                </Button>
            </div>
        </form>
    );
}
