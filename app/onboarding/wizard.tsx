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
import { CheckCircle2, ArrowRight, Server, Cloud, Mail, CreditCard, Bot, Zap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { InteractiveButton } from "@/components/ui/interactive-button";

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

interface OnboardingWizardProps {
    isCloudDeployment: boolean;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i < current
                            ? "bg-green-500 text-white"
                            : i === current
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {i < current ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div className={`h-0.5 w-8 transition-all duration-300 ${i < current ? "bg-green-500" : "bg-muted"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function DeploymentBanner({ isCloud }: { isCloud: boolean }) {
    if (isCloud) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-4 mb-6">
                <Cloud className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Cloud Deployment Detected</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        You're running on a hosted platform. Social login and cloud database are active. We'll guide you through connecting your email and payment providers.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-4 mb-6">
            <Server className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Self-Hosted Mode</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    You're running InvoiceSlayer on your own infrastructure. Email/password login is active. All integrations are optional — you can start invoicing right away.
                </p>
            </div>
        </div>
    );
}

interface ChecklistItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    done?: boolean;
    badge?: string;
}

function SetupChecklist({ isCloud }: { isCloud: boolean }) {
    const cloudItems: ChecklistItem[] = [
        {
            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
            title: "Company details saved",
            description: "Your profile is set up and ready.",
            href: "#",
            done: true,
        },
        {
            icon: <Mail className="w-5 h-5 text-orange-500" />,
            title: "Set up email sending",
            description: "Connect Resend to send invoices and quotes by email.",
            href: "/settings",
            badge: "Required",
        },
        {
            icon: <CreditCard className="w-5 h-5 text-purple-500" />,
            title: "Connect Stripe",
            description: "Accept online payments with a payment link on every invoice.",
            href: "/settings",
            badge: "Recommended",
        },
        {
            icon: <Zap className="w-5 h-5 text-blue-500" />,
            title: "Create your first invoice",
            description: "You're ready to start billing clients.",
            href: "/invoices/new",
        },
    ];

    const dockerItems: ChecklistItem[] = [
        {
            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
            title: "Company details saved",
            description: "Your profile is set up and ready.",
            href: "#",
            done: true,
        },
        {
            icon: <Mail className="w-5 h-5 text-orange-500" />,
            title: "Set up email sending",
            description: "Add a Resend API key in Settings to send invoices by email. Skip this to use PDF exports only.",
            href: "/settings",
            badge: "Optional",
        },
        {
            icon: <Bot className="w-5 h-5 text-violet-500" />,
            title: "Configure Local AI",
            description: "Point to a local Ollama instance for AI-powered invoice generation — no cloud required.",
            href: "/settings",
            badge: "Optional",
        },
        {
            icon: <CreditCard className="w-5 h-5 text-purple-500" />,
            title: "Connect Stripe",
            description: "Accept online payments. Skip this to use manual payment tracking only.",
            href: "/settings",
            badge: "Optional",
        },
        {
            icon: <Zap className="w-5 h-5 text-blue-500" />,
            title: "Create your first invoice",
            description: "You're ready to start billing clients.",
            href: "/invoices/new",
        },
    ];

    const items = isCloud ? cloudItems : dockerItems;

    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <Link
                    key={i}
                    href={item.href}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${item.done
                        ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 cursor-default pointer-events-none"
                        : "border-border hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                        }`}
                >
                    <div className="mt-0.5 shrink-0">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{item.title}</p>
                            {item.badge && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badge === "Required"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                    : item.badge === "Recommended"
                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                        : "bg-muted text-muted-foreground"
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    {!item.done && <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                </Link>
            ))}
        </div>
    );
}

export function OnboardingWizard({ isCloudDeployment }: OnboardingWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState(0);
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
                toast.success("Company details saved!");
                setStep(2);
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
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <Image
                        src="/images/gifx.gif"
                        alt="InvoiceSlayer"
                        width={80}
                        height={80}
                        className="rounded-xl object-cover"
                        priority
                        unoptimized
                    />
                </div>

                <StepIndicator current={step} total={3} />

                {/* Step 0: Welcome */}
                {step === 0 && (
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Welcome to InvoiceSlayer</CardTitle>
                            <CardDescription>
                                Let's get you set up in just a couple of steps.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeploymentBanner isCloud={isCloudDeployment} />
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>Create and send professional invoices & quotes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>Track payments, expenses, and projects</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>
                                        {isCloudDeployment
                                            ? "Accept online payments via Stripe"
                                            : "Works fully offline — no cloud required"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>
                                        {isCloudDeployment
                                            ? "AI-powered invoice generation"
                                            : "AI-powered generation via local Ollama"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <InteractiveButton className="w-full" onClick={() => setStep(1)}>
                                Get Started <ArrowRight className="ml-2 w-4 h-4" />
                            </InteractiveButton>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 1: Company Details */}
                {step === 1 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Company Details</CardTitle>
                            <CardDescription>
                                This information will appear on your invoices and quotes.
                            </CardDescription>
                        </CardHeader>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyAddress">
                                            Address <span className="text-muted-foreground text-xs">(optional)</span>
                                        </Label>
                                        <Input id="companyAddress" {...register("companyAddress")} placeholder="123 Main St" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyPhone">
                                            Phone <span className="text-muted-foreground text-xs">(optional)</span>
                                        </Label>
                                        <Input id="companyPhone" {...register("companyPhone")} placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                                                <SelectItem value="CHF">CHF (Fr)</SelectItem>
                                                <SelectItem value="INR">INR (₹)</SelectItem>
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
                                </div>

                                <input type="hidden" {...register("invoiceTemplate")} />
                                <input type="hidden" {...register("quoteTemplate")} />
                            </CardContent>
                            <CardFooter className="flex gap-3">
                                <InteractiveButton type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                                    Back
                                </InteractiveButton>
                                <InteractiveButton type="submit" className="flex-1" disabled={isSubmitting} loading={isSubmitting}>
                                    {!isSubmitting && "Save & Continue"}
                                    {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
                                </InteractiveButton>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Step 2: Setup Checklist */}
                {step === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>🎉 You're all set!</CardTitle>
                            <CardDescription>
                                {isCloudDeployment
                                    ? "Here's what we recommend setting up next to get the most out of InvoiceSlayer."
                                    : "Everything below is optional. You can start invoicing right away, or configure integrations whenever you're ready."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SetupChecklist isCloud={isCloudDeployment} />
                        </CardContent>
                        <CardFooter>
                            <InteractiveButton className="w-full" onClick={() => router.push("/")}>
                                Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                            </InteractiveButton>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
