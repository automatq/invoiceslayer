"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSettings } from "@/app/actions/settings";
import { register as registerUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { CheckCircle2, ArrowRight, Server, Cloud, Mail, CreditCard, Bot, Zap, ChevronRight, Lock, UserPlus, UserCircle } from "lucide-react";
import Link from "next/link";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useAuth } from "@/hooks/use-auth";
import { SocialLogins } from "@/components/SocialLogins";

const SettingsSchema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    companyEmail: z.string().email("Invalid email address"),
    companyAddress: z.string(),
    companyPhone: z.string(),
    currency: z.string().min(1, "Currency is required"),
    defaultTaxRate: z.number().min(0).max(100),
    invoiceTemplate: z.string().min(1),
    quoteTemplate: z.string().min(1),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

const RegistrationSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegistrationFormValues = z.infer<typeof RegistrationSchema>;

interface OnboardingWizardProps {
    isCloudDeployment: boolean;
    googleEnabled: boolean;
    githubEnabled: boolean;
    hasSettings?: boolean;
}

function StepIndicator({ current, total, getStepLabel, isCloud }: { current: number; total: number; getStepLabel: (i: number) => string; isCloud: boolean }) {
    return (
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 border-2 ${i < current
                                ? "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                : i === current
                                    ? isCloud
                                        ? "bg-blue-500 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-110"
                                        : "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-110"
                                    : "bg-neutral-800 border-neutral-700 text-neutral-500"
                                }`}
                        >
                            {i < current ? <CheckCircle2 className="w-5 h-5" strokeWidth={3} /> : i + 1}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${i === current ? (isCloud ? "text-blue-400" : "text-emerald-400") : i < current ? "text-green-400" : "text-neutral-600"}`}>
                            {getStepLabel(i)}
                        </span>
                    </div>
                    {i < total - 1 && (
                        <div className={`h-[2px] w-6 sm:w-10 transition-all duration-500 mx-2 sm:mx-3 ${i < current ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-neutral-800"}`} />
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

export function OnboardingWizard({ isCloudDeployment, googleEnabled, githubEnabled, hasSettings }: OnboardingWizardProps) {
    const router = useRouter();
    const { user, status: authStatus, isClerk } = useAuth();
    const nextAuthStatus = authStatus === "authenticated" ? "authenticated" : (authStatus === "loading" ? "loading" : "unauthenticated");
    const clerkUser = isClerk ? user : null;
    const clerkLoaded = true; // Handled by useAuth internally
    const [mounted, setMounted] = useState(false);

    // Use sessionStorage to persist step across refreshes during the onboarding process
    // Steps: 0 = Welcome, 1 = Auth (Docker: Register/Cloud: OAuth), 2 = Business Profile, 3 = Success
    const [step, setStep] = useState<number>(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const isLoggedIn = !!user;
    const isAuthLoading = authStatus === "loading";

    // Determine total steps based on deployment type
    // Both flows have 3 main steps: Welcome → Auth → Profile → Success (step 3 is completion)
    const totalSteps = 3;

    // Get step labels based on deployment type
    const getStepLabel = (stepIndex: number): string => {
        if (isCloudDeployment) {
            switch (stepIndex) {
                case 0: return "Welcome";
                case 1: return "Connect";
                case 2: return "Profile";
                default: return "";
            }
        } else {
            switch (stepIndex) {
                case 0: return "Welcome";
                case 1: return "Account";
                case 2: return "Profile";
                default: return "";
            }
        }
    };

    // Handle hydration
    useEffect(() => {
        setMounted(true);
        const saved = sessionStorage.getItem("onboarding_step");
        if (saved !== null) {
            setStep(parseInt(saved, 10));
        }
    }, []);

    // Persist step changes
    useEffect(() => {
        sessionStorage.setItem("onboarding_step", step.toString());
    }, [step]);

    // Redirect if onboarding already done (but only if we aren't on the final success step)
    useEffect(() => {
        if (hasSettings && step < totalSteps) {
            router.push("/");
        }
    }, [hasSettings, step, router]);

    // Automatically advance from Auth (Step 1) to Profile (Step 2) if login is detected
    useEffect(() => {
        if (isAuthLoading) return;
        if (step === 1 && isLoggedIn) {
            console.log("[wizard] User logged in, advancing to Profile step");
            setStep(2);
        }
    }, [step, isLoggedIn, isAuthLoading]);

    // If user is already logged in when landing on onboarding, skip to Profile step
    useEffect(() => {
        if (isAuthLoading) return;
        if (step === 0 && isLoggedIn && mounted) {
            console.log("[wizard] User already logged in on mount, advancing to Profile step");
            setStep(2);
        }
    }, [isAuthLoading, isLoggedIn, mounted, step]);

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
            defaultTaxRate: 0,
            invoiceTemplate: "modern",
            quoteTemplate: "modern",
        },
    });

    const {
        register: registerReg,
        handleSubmit: handleSubmitReg,
        formState: { errors: errorsReg },
    } = useForm<RegistrationFormValues>({
        resolver: zodResolver(RegistrationSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const onRegisterSubmit = async (data: RegistrationFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await registerUser(data);
            if (result.success) {
                toast.success("Account created! Please sign in.");
                // After successful registration, lead to login or auto-signin if possible
                // For simplicity, we trigger a sign-in directly
                await signIn("credentials", {
                    email: data.email,
                    password: data.password,
                    callbackUrl: "/onboarding",
                });
            } else {
                toast.error(result.error || "Failed to create account");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred during registration");
        } finally {
            setIsSubmitting(false);
        }
    };

    const onBeginSetup = () => {
        if (isLoggedIn) {
            setStep(2);
        } else {
            setStep(1);
        }
    };

    const onSubmit = async (data: SettingsFormValues) => {
        setIsSubmitting(true);
        try {
            // Convert empty strings to undefined for optional fields
            const cleanedData = {
                ...data,
                companyAddress: data.companyAddress?.trim() || undefined,
                companyPhone: data.companyPhone?.trim() || undefined,
                defaultTaxRate: Number(data.defaultTaxRate) || 0,
            };
            console.log("Submitting settings:", cleanedData);
            const result = await createSettings(cleanedData);
            if (result.success) {
                toast.success("Settings saved successfully!");
                setStep(3);
                router.refresh(); // Refresh to update hasSettings server-side
            } else {
                toast.error("Failed to save settings", {
                    description: result.message || "Please try again.",
                });
            }
        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error("An unexpected error occurred", {
                description: error.message || "Please try again later."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!mounted) return null; // Avoid hydration mismatch

    const showOAuth = isCloudDeployment && (googleEnabled || githubEnabled);

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

                <StepIndicator current={step} total={totalSteps} getStepLabel={getStepLabel} isCloud={isCloudDeployment} />

                {/* Step 0: Welcome */}
                {step === 0 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl overflow-hidden ring-1 ring-white/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary/50"></div>
                        <CardHeader className="text-center pt-10 pb-2">
                            <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white">Welcome Aboard</CardTitle>
                            <CardDescription className="text-base font-bold text-white/50">
                                Let's get your business engine started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <DeploymentBanner isCloud={isCloudDeployment} />

                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-4 group/item">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    <span className="font-bold italic text-white/90 text-sm sm:text-base">Professional invoice & quote templates</span>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    <span className="font-bold italic text-white/90 text-sm sm:text-base">Automatic tax & currency management</span>
                                </div>
                                <div className="flex items-center gap-4 group/item">
                                    <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                                    <span className="font-bold italic text-white/90 text-sm sm:text-base">
                                        {isCloudDeployment
                                            ? "AI-powered invoice generation"
                                            : "AI-powered generation via local Ollama"}
                                    </span>
                                </div>
                            </div>

                            <InteractiveButton className="w-full h-16 text-xl font-black italic tracking-tighter uppercase rounded-2xl shadow-2xl shadow-primary/20" onClick={onBeginSetup}>
                                BEGIN SETUP <ArrowRight className="ml-2 w-6 h-6" />
                            </InteractiveButton>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Auth - Cloud: OAuth / Docker: Account Creation */}
                {step === 1 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isCloudDeployment ? "from-blue-500 via-blue-400 to-blue-500" : "from-purple-500 via-violet-400 to-purple-500"}`}></div>
                        <CardHeader className="pt-10 pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${isCloudDeployment ? "bg-blue-500/20" : "bg-purple-500/20"}`}>
                                    {isCloudDeployment ? <Cloud className="w-6 h-6 text-blue-400" /> : <Lock className="w-6 h-6 text-purple-400" />}
                                </div>
                                <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                    {isCloudDeployment ? "Connect" : "Account"}
                                </CardTitle>
                            </div>
                            <CardDescription className="text-base font-bold text-white/50">
                                {isCloudDeployment ? "Sign in with your preferred provider to continue." : "Create your administrative account to get started."}
                            </CardDescription>
                        </CardHeader>

                        {showOAuth ? (
                            <CardContent className="p-8 space-y-6">
                                <SocialLogins googleEnabled={googleEnabled} githubEnabled={githubEnabled} />
                                <div className="text-center text-xs text-white/30 font-bold uppercase tracking-widest mt-4">
                                    Secure cloud authentication enabled
                                </div>
                            </CardContent>
                        ) : (
                            <form onSubmit={handleSubmitReg(onRegisterSubmit)}>
                                <CardContent className="space-y-4 p-8">
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-purple-400 transition-colors ml-1">Full Name</Label>
                                        <Input {...registerReg("name")} placeholder="JOHN DOE" className="h-14 bg-white/[0.03] border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all font-black" />
                                        {errorsReg.name && <p className="text-[10px] uppercase font-black text-red-500 mt-1 ml-1">{errorsReg.name.message}</p>}
                                    </div>
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-purple-400 transition-colors ml-1">Admin Email</Label>
                                        <Input type="email" {...registerReg("email")} placeholder="ADMIN@EXAMPLE.COM" className="h-14 bg-white/[0.03] border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all font-black" />
                                        {errorsReg.email && <p className="text-[10px] uppercase font-black text-red-500 mt-1 ml-1">{errorsReg.email.message}</p>}
                                    </div>
                                    <div className="space-y-2 group">
                                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-white/30 group-focus-within:text-purple-400 transition-colors ml-1">Password</Label>
                                        <Input type="password" {...registerReg("password")} placeholder="••••••••" className="h-14 bg-white/[0.03] border-white/10 text-white rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all font-black" />
                                        {errorsReg.password && <p className="text-[10px] uppercase font-black text-red-500 mt-1 ml-1">{errorsReg.password.message}</p>}
                                    </div>

                                    <Button type="submit" className="w-full h-16 mt-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black italic uppercase tracking-tighter text-xl shadow-lg shadow-purple-500/20" disabled={isSubmitting}>
                                        {isSubmitting ? "CREATING..." : "CREATE ACCOUNT"}
                                        {!isSubmitting && <UserPlus className="ml-2 w-6 h-6" />}
                                    </Button>
                                </CardContent>
                            </form>
                        )}
                        <CardFooter className="justify-center pb-8 pt-0">
                            <p className="text-xs font-bold text-white/30 italic">Already have an account? <Link href="/login" className="text-purple-400 hover:underline">Log In</Link></p>
                        </CardFooter>
                    </Card>
                )}

                {/* Step 2: Business Profile */}
                {step === 2 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isCloudDeployment ? "from-blue-500 via-cyan-400 to-blue-500" : "from-emerald-500 via-green-400 to-emerald-500"}`}></div>
                        <CardHeader className="pt-10 pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${isCloudDeployment ? "bg-blue-500/20" : "bg-emerald-500/20"}`}>
                                    <UserCircle className={`w-6 h-6 ${isCloudDeployment ? "text-blue-400" : "text-emerald-400"}`} />
                                </div>
                                <CardTitle className="text-4xl font-black italic uppercase tracking-tighter text-white">Business Profile</CardTitle>
                            </div>
                            <CardDescription className="text-base font-bold text-white/50">
                                {isCloudDeployment ? "Set up your company details for professional invoices." : "Essential details for your invoice headers."}
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
                                            <SelectContent className="bg-neutral-900 border-white/10 text-white rounded-2xl max-h-80">
                                                <SelectItem value="USD" className="font-black italic uppercase">USD ($)</SelectItem>
                                                <SelectItem value="EUR" className="font-black italic uppercase">EUR (€)</SelectItem>
                                                <SelectItem value="GBP" className="font-black italic uppercase">GBP (£)</SelectItem>
                                                <SelectItem value="CAD" className="font-black italic uppercase">CAD (C$)</SelectItem>
                                                <SelectItem value="AUD" className="font-black italic uppercase">AUD (A$)</SelectItem>
                                                <SelectItem value="JPY" className="font-black italic uppercase">JPY (¥)</SelectItem>
                                                <SelectItem value="CNY" className="font-black italic uppercase">CNY (¥)</SelectItem>
                                                <SelectItem value="INR" className="font-black italic uppercase">INR (₹)</SelectItem>
                                                <SelectItem value="CHF" className="font-black italic uppercase">CHF (Fr)</SelectItem>
                                                <SelectItem value="SEK" className="font-black italic uppercase">SEK (kr)</SelectItem>
                                                <SelectItem value="NOK" className="font-black italic uppercase">NOK (kr)</SelectItem>
                                                <SelectItem value="DKK" className="font-black italic uppercase">DKK (kr)</SelectItem>
                                                <SelectItem value="NZD" className="font-black italic uppercase">NZD (NZ$)</SelectItem>
                                                <SelectItem value="SGD" className="font-black italic uppercase">SGD (S$)</SelectItem>
                                                <SelectItem value="HKD" className="font-black italic uppercase">HKD (HK$)</SelectItem>
                                                <SelectItem value="KRW" className="font-black italic uppercase">KRW (₩)</SelectItem>
                                                <SelectItem value="BRL" className="font-black italic uppercase">BRL (R$)</SelectItem>
                                                <SelectItem value="MXN" className="font-black italic uppercase">MXN (Mex$)</SelectItem>
                                                <SelectItem value="ZAR" className="font-black italic uppercase">ZAR (R)</SelectItem>
                                                <SelectItem value="TRY" className="font-black italic uppercase">TRY (₺)</SelectItem>
                                                <SelectItem value="AED" className="font-black italic uppercase">AED (د.إ)</SelectItem>
                                                <SelectItem value="SAR" className="font-black italic uppercase">SAR (﷼)</SelectItem>
                                                <SelectItem value="THB" className="font-black italic uppercase">THB (฿)</SelectItem>
                                                <SelectItem value="MYR" className="font-black italic uppercase">MYR (RM)</SelectItem>
                                                <SelectItem value="PHP" className="font-black italic uppercase">PHP (₱)</SelectItem>
                                                <SelectItem value="IDR" className="font-black italic uppercase">IDR (Rp)</SelectItem>
                                                <SelectItem value="PLN" className="font-black italic uppercase">PLN (zł)</SelectItem>
                                                <SelectItem value="CZK" className="font-black italic uppercase">CZK (Kč)</SelectItem>
                                                <SelectItem value="HUF" className="font-black italic uppercase">HUF (Ft)</SelectItem>
                                                <SelectItem value="ILS" className="font-black italic uppercase">ILS (₪)</SelectItem>
                                                <SelectItem value="CLP" className="font-black italic uppercase">CLP (CLP$)</SelectItem>
                                                <SelectItem value="PEN" className="font-black italic uppercase">PEN (S/)</SelectItem>
                                                <SelectItem value="COP" className="font-black italic uppercase">COP (COL$)</SelectItem>
                                                <SelectItem value="ARS" className="font-black italic uppercase">ARS (ARS$)</SelectItem>
                                                <SelectItem value="VEF" className="font-black italic uppercase">VEF (Bs)</SelectItem>
                                                <SelectItem value="BOB" className="font-black italic uppercase">BOB (Bs)</SelectItem>
                                                <SelectItem value="PYG" className="font-black italic uppercase">PYG (₲)</SelectItem>
                                                <SelectItem value="UYU" className="font-black italic uppercase">UYU ($U)</SelectItem>
                                                <SelectItem value="DOP" className="font-black italic uppercase">DOP (RD$)</SelectItem>
                                                <SelectItem value="GTQ" className="font-black italic uppercase">GTQ (Q)</SelectItem>
                                                <SelectItem value="HNL" className="font-black italic uppercase">HNL (L)</SelectItem>
                                                <SelectItem value="NIO" className="font-black italic uppercase">NIO (C$)</SelectItem>
                                                <SelectItem value="CRC" className="font-black italic uppercase">CRC (₡)</SelectItem>
                                                <SelectItem value="PAB" className="font-black italic uppercase">PAB (B/)</SelectItem>
                                                <SelectItem value="BZD" className="font-black italic uppercase">BZD (BZ$)</SelectItem>
                                                <SelectItem value="XCD" className="font-black italic uppercase">XCD (EC$)</SelectItem>
                                                <SelectItem value="TTD" className="font-black italic uppercase">TTD (TT$)</SelectItem>
                                                <SelectItem value="BBD" className="font-black italic uppercase">BBD (Bds$)</SelectItem>
                                                <SelectItem value="JMD" className="font-black italic uppercase">JMD (J$)</SelectItem>
                                                <SelectItem value="BSD" className="font-black italic uppercase">BSD (B$)</SelectItem>
                                                <SelectItem value="CUP" className="font-black italic uppercase">CUP ($MN)</SelectItem>
                                                <SelectItem value="RUB" className="font-black italic uppercase">RUB (₽)</SelectItem>
                                                <SelectItem value="UAH" className="font-black italic uppercase">UAH (₴)</SelectItem>
                                                <SelectItem value="RON" className="font-black italic uppercase">RON (lei)</SelectItem>
                                                <SelectItem value="BGN" className="font-black italic uppercase">BGN (лв)</SelectItem>
                                                <SelectItem value="HRK" className="font-black italic uppercase">HRK (kn)</SelectItem>
                                                <SelectItem value="RSD" className="font-black italic uppercase">RSD (дин)</SelectItem>
                                                <SelectItem value="MKD" className="font-black italic uppercase">MKD (ден)</SelectItem>
                                                <SelectItem value="BAM" className="font-black italic uppercase">BAM (KM)</SelectItem>
                                                <SelectItem value="ISK" className="font-black italic uppercase">ISK (kr)</SelectItem>
                                                <SelectItem value="GEL" className="font-black italic uppercase">GEL (₾)</SelectItem>
                                                <SelectItem value="AMD" className="font-black italic uppercase">AMD (֏)</SelectItem>
                                                <SelectItem value="AZN" className="font-black italic uppercase">AZN (₼)</SelectItem>
                                                <SelectItem value="KZT" className="font-black italic uppercase">KZT (₸)</SelectItem>
                                                <SelectItem value="UZS" className="font-black italic uppercase">UZS (so'm)</SelectItem>
                                                <SelectItem value="TJS" className="font-black italic uppercase">TJS (ЅМ)</SelectItem>
                                                <SelectItem value="KGS" className="font-black italic uppercase">KGS (сом)</SelectItem>
                                                <SelectItem value="TMT" className="font-black italic uppercase">TMT (T)</SelectItem>
                                                <SelectItem value="AFN" className="font-black italic uppercase">AFN (؋)</SelectItem>
                                                <SelectItem value="PKR" className="font-black italic uppercase">PKR (₨)</SelectItem>
                                                <SelectItem value="LKR" className="font-black italic uppercase">LKR (₨)</SelectItem>
                                                <SelectItem value="BDT" className="font-black italic uppercase">BDT (৳)</SelectItem>
                                                <SelectItem value="NPR" className="font-black italic uppercase">NPR (₨)</SelectItem>
                                                <SelectItem value="MMK" className="font-black italic uppercase">MMK (K)</SelectItem>
                                                <SelectItem value="KHR" className="font-black italic uppercase">KHR (៛)</SelectItem>
                                                <SelectItem value="LAK" className="font-black italic uppercase">LAK (₭)</SelectItem>
                                                <SelectItem value="VND" className="font-black italic uppercase">VND (₫)</SelectItem>
                                                <SelectItem value="MNT" className="font-black italic uppercase">MNT (₮)</SelectItem>
                                                <SelectItem value="KPW" className="font-black italic uppercase">KPW (₩)</SelectItem>
                                                <SelectItem value="BND" className="font-black italic uppercase">BND (B$)</SelectItem>
                                                <SelectItem value="FJD" className="font-black italic uppercase">FJD (FJ$)</SelectItem>
                                                <SelectItem value="PGK" className="font-black italic uppercase">PGK (K)</SelectItem>
                                                <SelectItem value="SBD" className="font-black italic uppercase">SBD (SI$)</SelectItem>
                                                <SelectItem value="TOP" className="font-black italic uppercase">TOP (T$)</SelectItem>
                                                <SelectItem value="WST" className="font-black italic uppercase">WST (WS$)</SelectItem>
                                                <SelectItem value="VUV" className="font-black italic uppercase">VUV (VT)</SelectItem>
                                                <SelectItem value="KWD" className="font-black italic uppercase">KWD (د.ك)</SelectItem>
                                                <SelectItem value="BHD" className="font-black italic uppercase">BHD (د.ب)</SelectItem>
                                                <SelectItem value="OMR" className="font-black italic uppercase">OMR (ر.ع.)</SelectItem>
                                                <SelectItem value="QAR" className="font-black italic uppercase">QAR (ر.ق)</SelectItem>
                                                <SelectItem value="JOD" className="font-black italic uppercase">JOD (د.ا)</SelectItem>
                                                <SelectItem value="LBP" className="font-black italic uppercase">LBP (ل.ل)</SelectItem>
                                                <SelectItem value="SYP" className="font-black italic uppercase">SYP (ل.س)</SelectItem>
                                                <SelectItem value="YER" className="font-black italic uppercase">YER (﷼)</SelectItem>
                                                <SelectItem value="IQD" className="font-black italic uppercase">IQD (ع.د)</SelectItem>
                                                <SelectItem value="LYD" className="font-black italic uppercase">LYD (ل.د)</SelectItem>
                                                <SelectItem value="SDG" className="font-black italic uppercase">SDG (ج.س.)</SelectItem>
                                                <SelectItem value="EGP" className="font-black italic uppercase">EGP (ج.م)</SelectItem>
                                                <SelectItem value="MAD" className="font-black italic uppercase">MAD (د.م.)</SelectItem>
                                                <SelectItem value="TND" className="font-black italic uppercase">TND (د.ت)</SelectItem>
                                                <SelectItem value="DZD" className="font-black italic uppercase">DZD (د.ج)</SelectItem>
                                                <SelectItem value="MRU" className="font-black italic uppercase">MRU (أ.م.)</SelectItem>
                                                <SelectItem value="XOF" className="font-black italic uppercase">XOF (CFA)</SelectItem>
                                                <SelectItem value="XAF" className="font-black italic uppercase">XAF (CFA)</SelectItem>
                                                <SelectItem value="XPF" className="font-black italic uppercase">XPF (CFP)</SelectItem>
                                                <SelectItem value="NGN" className="font-black italic uppercase">NGN (₦)</SelectItem>
                                                <SelectItem value="GHS" className="font-black italic uppercase">GHS (₵)</SelectItem>
                                                <SelectItem value="KES" className="font-black italic uppercase">KES (KSh)</SelectItem>
                                                <SelectItem value="UGX" className="font-black italic uppercase">UGX (USh)</SelectItem>
                                                <SelectItem value="TZS" className="font-black italic uppercase">TZS (TSh)</SelectItem>
                                                <SelectItem value="RWF" className="font-black italic uppercase">RWF (FRw)</SelectItem>
                                                <SelectItem value="BIF" className="font-black italic uppercase">BIF (FBu)</SelectItem>
                                                <SelectItem value="CDF" className="font-black italic uppercase">CDF (FC)</SelectItem>
                                                <SelectItem value="AOA" className="font-black italic uppercase">AOA (Kz)</SelectItem>
                                                <SelectItem value="ZMW" className="font-black italic uppercase">ZMW (ZK)</SelectItem>
                                                <SelectItem value="MWK" className="font-black italic uppercase">MWK (MK)</SelectItem>
                                                <SelectItem value="BWP" className="font-black italic uppercase">BWP (P)</SelectItem>
                                                <SelectItem value="NAD" className="font-black italic uppercase">NAD (N$)</SelectItem>
                                                <SelectItem value="SZL" className="font-black italic uppercase">SZL (E)</SelectItem>
                                                <SelectItem value="LSL" className="font-black italic uppercase">LSL (L)</SelectItem>
                                                <SelectItem value="MZN" className="font-black italic uppercase">MZN (MT)</SelectItem>
                                                <SelectItem value="SCR" className="font-black italic uppercase">SCR (₨)</SelectItem>
                                                <SelectItem value="MUR" className="font-black italic uppercase">MUR (₨)</SelectItem>
                                                <SelectItem value="ETB" className="font-black italic uppercase">ETB (ብር)</SelectItem>
                                                <SelectItem value="SOS" className="font-black italic uppercase">SOS (Sh)</SelectItem>
                                                <SelectItem value="DJF" className="font-black italic uppercase">DJF (Fdj)</SelectItem>
                                                <SelectItem value="ERN" className="font-black italic uppercase">ERN (Nfk)</SelectItem>
                                                <SelectItem value="GMD" className="font-black italic uppercase">GMD (D)</SelectItem>
                                                <SelectItem value="GNF" className="font-black italic uppercase">GNF (FG)</SelectItem>
                                                <SelectItem value="SLL" className="font-black italic uppercase">SLL (Le)</SelectItem>
                                                <SelectItem value="LRD" className="font-black italic uppercase">LRD (L$)</SelectItem>
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
                                {/* Hidden inputs for template fields required by schema */}
                                <input type="hidden" {...register("invoiceTemplate")} value="modern" />
                                <input type="hidden" {...register("quoteTemplate")} value="modern" />
                            </CardContent>
                            <CardFooter className="flex gap-4 p-8 pt-0">
                                <Button type="submit" className="flex-1 h-16 bg-white text-black hover:bg-white/90 rounded-2xl font-black italic uppercase tracking-tighter text-xl active:scale-[0.98] transition-all" disabled={isSubmitting}>
                                    {isSubmitting ? "SAVING..." : "SAVE & CONTINUE"}
                                    {!isSubmitting && <ArrowRight className="ml-2 w-6 h-6" />}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* Step 3: Success / Setup Checklist */}
                {step === 3 && (
                    <Card className="border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] bg-neutral-900/80 backdrop-blur-2xl ring-1 ring-white/10 overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${isCloudDeployment ? "from-blue-500 via-green-400 to-emerald-500" : "from-emerald-500 via-green-400 to-green-500"} shadow-[0_0_15px_rgba(34,197,94,0.3)]`}></div>
                        <CardHeader className="text-center pt-10 pb-6">
                            <CardTitle className={`text-4xl font-black italic uppercase tracking-tighter text-white flex items-center justify-center gap-4 ${isCloudDeployment ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400" : ""}`}>
                                {isCloudDeployment ? "CLOUD READY" : "READY TO SLAY"} <CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={3} />
                            </CardTitle>
                            <CardDescription className="text-base font-bold text-white/50">
                                {isCloudDeployment
                                    ? "Your cloud workspace is configured. Connect your services to start invoicing."
                                    : "Your local instance is ready. All data stays on your infrastructure."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <SetupChecklist isCloud={isCloudDeployment} />
                        </CardContent>
                        <CardFooter className="p-8 pt-0">
                            <Button
                                className="w-full h-16 bg-white text-black hover:bg-white/90 rounded-2xl font-black italic uppercase tracking-tighter text-xl active:scale-[0.98] transition-all"
                                onClick={() => {
                                    sessionStorage.removeItem("onboarding_step");
                                    router.push("/");
                                    router.refresh(); // Ensure server-side state is re-fetched
                                }}
                            >
                                GO TO DASHBOARD <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div >
    );
}
