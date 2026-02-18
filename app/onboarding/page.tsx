"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSettings } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";

const SettingsSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyEmail: z.string().email("Invalid email address"),
    companyAddress: z.string().optional(),
    companyPhone: z.string().optional(),
    currency: z.string().min(1, "Currency is required"),
    defaultTaxRate: z.number().min(0).max(100),
    invoiceTemplate: z.string(),
    quoteTemplate: z.string(),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

export default function OnboardingPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<SettingsFormValues>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            companyName: "",
            companyEmail: "",
            companyAddress: "",
            companyPhone: "",
            currency: "USD",
            defaultTaxRate: 13,
            invoiceTemplate: "modern",
            quoteTemplate: "modern",
        },
    });

    const onSubmit = async (data: SettingsFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createSettings(data);
            if (result.success) {
                toast.success("Welcome aboard!", {
                    description: "Your company details have been saved.",
                });
                router.push("/");
                router.refresh();
            } else {
                toast.error("Failed to save settings", {
                    description: result.message || "Please try again.",
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome to InvoiceSlayer</CardTitle>
                    <CardDescription>Let's get you set up with your company details.</CardDescription>
                </CardHeader>
                <div className="flex justify-center pb-2">
                    <Image
                        src="/images/gifx.gif"
                        alt="Invoice Slayer"
                        width={280}
                        height={280}
                        className="rounded-lg object-cover"
                        priority
                        unoptimized
                    />
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" {...register("companyName")} placeholder="Acme Inc." />
                            {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyEmail">Company Email</Label>
                            <Input id="companyEmail" type="email" {...register("companyEmail")} placeholder="contact@acme.com" />
                            {errors.companyEmail && <p className="text-xs text-red-500">{errors.companyEmail.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyAddress">Address (Optional)</Label>
                            <Input id="companyAddress" {...register("companyAddress")} placeholder="123 Main St" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyPhone">Phone (Optional)</Label>
                            <Input id="companyPhone" {...register("companyPhone")} placeholder="+1 (555) 000-0000" />
                        </div>

                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select onValueChange={(value) => setValue("currency", value)} defaultValue="USD">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="CAD">CAD ($)</SelectItem>
                                    <SelectItem value="AUD">AUD ($)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.currency && <p className="text-xs text-red-500">{errors.currency.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                            <Input
                                id="defaultTaxRate"
                                type="number"
                                step="0.01"
                                {...register("defaultTaxRate", { valueAsNumber: true })}
                                placeholder="13"
                            />
                            {errors.defaultTaxRate && <p className="text-xs text-red-500">{errors.defaultTaxRate.message}</p>}
                        </div>

                        {/* Hidden fields for templates to ensure they are registered and submitted */}
                        <input type="hidden" {...register("invoiceTemplate")} />
                        <input type="hidden" {...register("quoteTemplate")} />
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" loading={isSubmitting}>
                            Get Started
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
