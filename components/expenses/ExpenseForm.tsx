"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { createExpense } from "@/app/actions/expenses";
import { getProjects } from "@/app/actions/projects";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const expenseSchema = z.object({
    description: z.string().min(2, "Description is required"),
    amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    date: z.date(),
    category: z.string().min(1, "Category is required"),
    receipt: z.string().optional(),
    projectId: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    const [projects, setProjects] = useState<any[]>([]);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseSchema) as any,
        defaultValues: {
            description: "",
            amount: 0,
            date: new Date(),
            category: "",
            receipt: "",
            projectId: "",
        },
    });

    useEffect(() => {
        getProjects().then(setProjects);
    }, []);

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            toast.error("File too large", { description: "Please upload an image under 500KB." });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setReceiptPreview(base64);
            form.setValue("receipt", base64);
        };
        reader.readAsDataURL(file);
    };

    const removeReceipt = () => {
        setReceiptPreview(null);
        form.setValue("receipt", "");
    };

    async function onSubmit(data: ExpenseFormValues) {
        setIsSubmitting(true);
        try {
            const result = await createExpense(data);
            if (result.success) {
                toast.success("Expense created successfully");
                form.reset();
                setReceiptPreview(null);
                router.refresh(); // Refresh dashboard data if on dashboard
                if (onSuccess) onSuccess();
            } else {
                toast.error("Failed to create expense");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Office Supplies" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="hosting">Hosting & Server</SelectItem>
                                        <SelectItem value="software">Software Subscriptions</SelectItem>
                                        <SelectItem value="office">Office Supplies</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="contractors">Contractors</SelectItem>
                                        <SelectItem value="travel">Travel</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={projects.length === 0 ? "No projects found" : "Select a project"} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name} ({project.client?.name})
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
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <InteractiveButton
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </InteractiveButton>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormItem>
                    <FormLabel>Receipt (Optional)</FormLabel>
                    <div className="flex items-center gap-4">
                        {receiptPreview ? (
                            <div className="relative group">
                                <img
                                    src={receiptPreview}
                                    alt="Receipt preview"
                                    className="h-20 w-20 rounded-md object-cover border border-neutral-200 dark:border-neutral-700"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={removeReceipt}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="h-20 w-20 rounded-md border-2 border-dashed border-neutral-200 dark:border-neutral-700 flex items-center justify-center bg-gray-50 dark:bg-neutral-900/50">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1">
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleReceiptUpload}
                                className="cursor-pointer file:cursor-pointer file:text-primary file:font-semibold"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Upload image (max 500KB)
                            </p>
                        </div>
                    </div>
                </FormItem>

                <div className="flex justify-end pt-2">
                    <InteractiveButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? "Creating..." : "Add Expense"}
                    </InteractiveButton>
                </div>
            </form>
        </Form>
    );
}
