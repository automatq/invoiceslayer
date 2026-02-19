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
import { Button } from "@/components/ui/button";

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
        <div className="flex items-center justify-center gap-3 mb-10">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex items-center">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 border-2 ${i < current
                            ? "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                            : i === current
                                ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-110"
                                : "bg-neutral-800 border-neutral-700 text-neutral-500"
                            }`}
                    >
                        {i < current ? <CheckCircle2 className="w-5 h-5" strokeWidth={3} /> : i + 1}
                    </div>
                    {i < total - 1 && (
                        <div className={`h-[2px] w-12 transition-all duration-500 mx-1 ${i < current ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-neutral-800"}`} />
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
        <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4 font-sans selection:bg-primary/30">
            <div className="w-full max-w-xl py-12">
                {/* Branding / GIF */}
                <div className="flex flex-col items-center justify-center mb-10 space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary to-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <Image
                            src="/images/gifx.gif"
                            alt="InvoiceSlayer"
                            width={140}
                            height={140}
                            className="relative rounded-3xl object-cover shadow-2xl border-4 border-white/10 dark:border-neutral-800/50 bg-neutral-900"
                            priority
                            unoptimized
                        />
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic tracking-tighter text-white">
                            INVOICE<span className="text-primary tracking-normal">SLAYER</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40 mt-2">Onboarding Wizard</p>
                    </div>
                </div>

                <StepIndicator current={step} total={3} />

                {/* Step 0: Welcome */}
                {step === 0 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl overflow-hidden ring-1 ring-white/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary/50"></div>
                        <CardHeader className="text-center pt-10 pb-2">
                            <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white">Welcome Aboard</CardTitle>
                            <CardDescription className="text-base font-bold text-white/50">
                                Let's get your business profile set up in seconds.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <DeploymentBanner isCloud={isCloudDeployment} />

                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-4 group/item">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    <span className="font-bold italic text-white/90">Professional invoice & quote templates</span>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    <span className="font-bold italic text-white/90">Automatic tax & currency management</span>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    <span className="font-bold italic text-white/90">
                                        {isCloudDeployment
                                            ? "AI-powered invoice generation"
                                            : "AI-powered generation via local Ollama"}
                                    </span>
                                </div>
                            </div>

                            <InteractiveButton className="w-full h-16 text-xl font-black italic tracking-tighter uppercase rounded-2xl shadow-2xl shadow-primary/20" onClick={() => setStep(1)}>
                                BEGIN SETUP <ArrowRight className="ml-2 w-6 h-6" />
                            </InteractiveButton>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Company Details */}
                {step === 1 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary/50"></div>
                        <CardHeader className="pt-10 pb-2">
                            <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white">Business Profile</CardTitle>
                            <CardDescription className="text-base font-bold text-white/50">
                                Essential details for your invoice headers.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <CardContent className="space-y-6 p-8">
                                <div className="space-y-2 group">
                                    <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-primary transition-colors ml-1">Company Name</Label>
                                    <Input {...register("companyName")} placeholder="ACME CREATIVE CO." className="h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-black placeholder:text-white/10 text-lg selection:bg-primary/30" />
                                    {errors.companyName && <p className="text-[10px] uppercase font-black text-red-500 mt-1 ml-1">{errors.companyName.message}</p>}
                                </div>

                                <div className="space-y-2 group">
                                    <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-primary transition-colors ml-1">Company Email</Label>
                                    <Input type="email" {...register("companyEmail")} placeholder="HELLO@ACME.COM" className="h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-black placeholder:text-white/10 text-lg selection:bg-primary/30" />
                                    {errors.companyEmail && <p className="text-[10px] uppercase font-black text-red-500 mt-1 ml-1">{errors.companyEmail.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-primary transition-colors ml-1">Address</Label>
                                        <Input {...register("companyAddress")} placeholder="STREET NAME..." className="h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-black placeholder:text-white/10 text-lg selection:bg-primary/30" />
                                    </div>
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-primary transition-colors ml-1">Phone</Label>
                                        <Input {...register("companyPhone")} placeholder="+1..." className="h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-black placeholder:text-white/10 text-lg selection:bg-primary/30" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-primary transition-colors ml-1">Currency</Label>
                                        <Select onValueChange={(value) => setValue("currency", value)} defaultValue="USD">
                                            <SelectTrigger className="h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all font-black text-lg">
                                                <SelectValue placeholder="USD ($)" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-2xl">
                                                <SelectItem value="USD" className="font-black italic uppercase">USD ($)</SelectItem>
                                                <SelectItem value="EUR" className="font-black italic uppercase">EUR (€)</SelectItem>
                                                <SelectItem value="GBP" className="font-black italic uppercase">GBP (£)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-primary transition-colors ml-1">Default Tax (%)</Label>
                                        <Input
                                            type="number"
                                            {...register("defaultTaxRate", { valueAsNumber: true })}
                                            placeholder="13"
                                            className="h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-black placeholder:text-white/10 text-lg selection:bg-primary/30"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-4 p-8 pt-0">
                                <Button type="button" variant="outline" onClick={() => setStep(0)} className="h-16 px-10 border-white/10 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl font-black uppercase tracking-widest transition-all">
                                    BACK
                                </Button>
                                <Button type="submit" className="flex-1 h-16 bg-white text-black hover:bg-white/90 rounded-2xl font-black italic uppercase tracking-tighter text-xl active:scale-[0.98] transition-all" disabled={isSubmitting}>
                                    {isSubmitting ? "SAVING..." : "SAVE & CONTINUE"}
                                    {!isSubmitting && <ArrowRight className="ml-2 w-6 h-6" />}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Step 2: Setup Checklist */}
                {step === 2 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"></div>
                        <CardHeader className="text-center pt-10 pb-6">
                            <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white flex items-center justify-center gap-4">
                                MISSION COMPLETE <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={3} />
                            </CardTitle>
                            <CardDescription className="text-base font-bold text-white/50">
                                {isCloudDeployment
                                    ? "Pro profile unlocked. Here's what we recommend next."
                                    : "Business engine started. All features are now available to explore."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <SetupChecklist isCloud={isCloudDeployment} />
                        </CardContent>
                        <CardFooter className="p-8 pt-0">
                            <Button className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-2xl font-black italic uppercase tracking-tighter text-xl active:scale-[0.98] transition-all" onClick={() => router.push("/")}>
                                GO TO DASHBOARD <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div >
    );
}
