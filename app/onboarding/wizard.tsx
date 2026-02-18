"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSettings } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${i < current
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                                : i === current
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground"
                            }`}
                    >
                        {i < current ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div className={`h-0.5 w-12 transition-all duration-300 ${i < current ? "bg-green-500" : "bg-muted"}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

function DeploymentBanner({ isCloud }: { isCloud: boolean }) {
    if (isCloud) {
        return (
            <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 p-4 mb-6 transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                    <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 italic">Cloud Deployment Detected</p>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                        You're running on a hosted platform. Social login and cloud database are active. We'll guide you through connecting your email and payment providers.
                    </p>
                </div>
            </div>
        );
    }
    return (
        <div className="flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-4 mb-6 transition-all duration-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
            <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg">
                <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <div>
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 italic">Self-Hosted Mode</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
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
            icon: <CheckCircle2 className="w-5 h-5 text-green-500 shadow-sm" />,
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
            icon: <CheckCircle2 className="w-5 h-5 text-green-500 shadow-sm" />,
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
        <div className="space-y-3">
            {items.map((item, i) => (
                <Link
                    key={i}
                    href={item.href}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${item.done
                            ? "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20 cursor-default pointer-events-none"
                            : "border-border hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm cursor-pointer"
                        }`}
                >
                    <div className="mt-0.5 shrink-0 bg-white dark:bg-neutral-800 p-2 rounded-lg shadow-sm border border-border">
                        {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap text-emerald-950 dark:text-emerald-50">
                            <p className="text-sm font-bold italic">{item.title}</p>
                            {item.badge && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badge === "Required"
                                        ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                        : item.badge === "Recommended"
                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">{item.description}</p>
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
                toast.success("Settings saved successfully!");
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
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900 p-4 font-sans">
            <div className="w-full max-w-xl">
                {/* Branding / GIF */}
                <div className="flex flex-col items-center justify-center mb-10 space-y-4">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <Image
                            src="/images/gifx.gif"
                            alt="InvoiceSlayer"
                            width={160}
                            height={160}
                            className="relative rounded-2xl object-cover shadow-2xl border-4 border-white dark:border-neutral-800"
                            priority
                            unoptimized
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">
                            INVOICE<span className="text-primary tracking-normal">SLAYER</span>
                        </h1>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground mt-1">Onboarding Wizard</p>
                    </div>
                </div>

                <StepIndicator current={step} total={3} />

                {/* Step 0: Welcome */}
                {step === 0 && (
                    <Card className="border-none shadow-2xl bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-3xl font-black italic tracking-tight underline-offset-8 decoration-primary/30">Welcome Aboard</CardTitle>
                            <CardDescription className="text-base font-medium">
                                Let's get your business profile set up in seconds.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <DeploymentBanner isCloud={isCloudDeployment} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/20">
                                    <Zap className="w-5 h-5 text-orange-500 shrink-0" />
                                    <span className="text-xs font-bold italic text-orange-900 dark:text-orange-100">Pro Invoicing</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20">
                                    <Bot className="w-5 h-5 text-blue-500 shrink-0" />
                                    <span className="text-xs font-bold italic text-blue-900 dark:text-blue-100">AI Powered</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/20">
                                    <CreditCard className="w-5 h-5 text-purple-500 shrink-0" />
                                    <span className="text-xs font-bold italic text-purple-900 dark:text-purple-100">Global Payments</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 transition-all">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span className="text-xs font-bold italic text-emerald-900 dark:text-emerald-100">
                                        {isCloudDeployment ? "Cloud Core" : "Local First"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-2">
                            <InteractiveButton className="w-full h-14 rounded-2xl text-lg font-black italic tracking-tight" onClick={() => setStep(1)}>
                                BEGIN SETUP <ArrowRight className="ml-2 w-5 h-5" />
                            </InteractiveButton>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 1: Company Details */}
                {step === 1 && (
                    <Card className="border-none shadow-2xl bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary/50"></div>
                        <CardHeader>
                            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Business Profile</CardTitle>
                            <CardDescription className="font-medium">
                                Essential details for your invoice headers.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        {...register("companyName")}
                                        placeholder="ACME CREATIVE CO."
                                        className="h-12 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary transition-all font-bold italic placeholder:font-normal placeholder:not-italic"
                                    />
                                    {errors.companyName && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.companyName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyEmail" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Company Email</Label>
                                    <Input
                                        id="companyEmail"
                                        type="email"
                                        {...register("companyEmail")}
                                        placeholder="HELLO@ACME.COM"
                                        className="h-12 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary transition-all font-bold italic placeholder:font-normal placeholder:not-italic"
                                    />
                                    {errors.companyEmail && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.companyEmail.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="companyAddress" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Address</Label>
                                        <Input
                                            id="companyAddress"
                                            {...register("companyAddress")}
                                            placeholder="STREET NAME..."
                                            className="h-12 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary transition-all font-bold italic placeholder:font-normal placeholder:not-italic text-xs"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="companyPhone" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Phone</Label>
                                        <Input
                                            id="companyPhone"
                                            {...register("companyPhone")}
                                            placeholder="+1..."
                                            className="h-12 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary transition-all font-bold italic placeholder:font-normal placeholder:not-italic text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Currency</Label>
                                        <Select onValueChange={(value) => setValue("currency", value)} defaultValue="USD">
                                            <SelectTrigger className="h-12 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-neutral-800 font-bold italic">
                                                <SelectValue placeholder="USD" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-2">
                                                <SelectItem value="USD" className="font-bold italic">USD ($)</SelectItem>
                                                <SelectItem value="EUR" className="font-bold italic">EUR (€)</SelectItem>
                                                <SelectItem value="GBP" className="font-bold italic">GBP (£)</SelectItem>
                                                <SelectItem value="CAD" className="font-bold italic">CAD ($)</SelectItem>
                                                <SelectItem value="AUD" className="font-bold italic">AUD ($)</SelectItem>
                                                <SelectItem value="JPY" className="font-bold italic">JPY (¥)</SelectItem>
                                                <SelectItem value="CHF" className="font-bold italic">CHF (Fr)</SelectItem>
                                                <SelectItem value="INR" className="font-bold italic">INR (₹)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.currency && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.currency.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="defaultTaxRate" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Default Tax (%)</Label>
                                        <Input
                                            id="defaultTaxRate"
                                            type="number"
                                            step="0.01"
                                            {...register("defaultTaxRate", { valueAsNumber: true })}
                                            placeholder="13"
                                            className="h-12 rounded-xl border-2 border-transparent bg-slate-100 dark:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:border-primary transition-all font-bold italic placeholder:font-normal placeholder:not-italic"
                                        />
                                        {errors.defaultTaxRate && <p className="text-[10px] font-bold text-red-500 ml-1 uppercase">{errors.defaultTaxRate.message}</p>}
                                    </div>
                                </div>

                                <input type="hidden" {...register("invoiceTemplate")} />
                                <input type="hidden" {...register("quoteTemplate")} />
                            </CardContent>
                            <CardFooter className="flex gap-4 pt-4 pb-6">
                                <InteractiveButton type="button" variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs">
                                    Back
                                </InteractiveButton>
                                <InteractiveButton type="submit" className="flex-2 w-full h-12 rounded-xl font-black italic uppercase tracking-tighter" disabled={isSubmitting} loading={isSubmitting}>
                                    {!isSubmitting && "SAVE & CONTINUE"}
                                    {!isSubmitting && <ArrowRight className="ml-2 w-4 h-4" />}
                                </InteractiveButton>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Step 2: Setup Checklist */}
                {step === 2 && (
                    <Card className="border-none shadow-2xl bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"></div>
                        <CardHeader className="text-center">
                            <CardTitle className="text-3xl font-black italic tracking-tight flex items-center justify-center gap-3">
                                MISSION COMPLETE <CheckCircle2 className="w-8 h-8 text-green-500 fill-green-500/10" />
                            </CardTitle>
                            <CardDescription className="text-base font-medium">
                                {isCloudDeployment
                                    ? "Pro profile unlocked. Here's what we recommend next."
                                    : "Business engine started. All features are now available to explorer."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2 pb-6">
                            <SetupChecklist isCloud={isCloudDeployment} />
                        </CardContent>
                        <CardFooter>
                            <InteractiveButton className="w-full h-14 rounded-2xl text-lg font-black italic tracking-tight" onClick={() => router.push("/")}>
                                GO TO BRAIN <ArrowRight className="ml-2 w-5 h-5" />
                            </InteractiveButton>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
