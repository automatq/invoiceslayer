"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { ModeToggle } from "@/components/mode-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSettings, getSettings, type SettingsFormValues } from "@/app/actions/settings";
import { Upload, X, AlertTriangle, Eye, EyeOff, Check, Zap, Loader2 } from "lucide-react";
import { PurgeDataAction } from "@/components/settings/PurgeDataAction";
import { cn } from "@/lib/utils";
import { verifyResendConnection, verifyStripeConnection } from "@/app/actions/verify-keys";
import { generateApiKey, revokeApiKey, getApiKey } from "@/app/actions/api-keys";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showKeys, setShowKeys] = useState({
        resend: false,
        stripePub: false,
        stripeSec: false
    });
    const [verificationStatus, setVerificationStatus] = useState<{
        resend: "idle" | "loading" | "success" | "error";
        stripe: "idle" | "loading" | "success" | "error";
    }>({
        resend: "idle",
        stripe: "idle"
    });
    const [formData, setFormData] = useState<SettingsFormValues>({
        companyName: "",
        companyEmail: "",
        companyAddress: "",
        companyPhone: "",
        companyLogo: "",
        companyWebsite: "",
        companyTaxId: "",
        paymentInstructions: "",
        currency: "USD",
        defaultTaxRate: 13,
        invoiceTemplate: "modern",
        quoteTemplate: "modern",
        resendApiKey: "",
        stripePublishableKey: "",
        stripeSecretKey: "",
        cryptoWalletAddress: "",
        localAiUrl: "http://localhost:11434/v1",
        localAiModel: "llama3",
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [agentApiKey, setAgentApiKey] = useState<string | null>(null);
    const [showAgentKey, setShowAgentKey] = useState(false);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);

    useEffect(() => {
        async function loadSettings() {
            const [settings, apiKey] = await Promise.all([
                getSettings(),
                getApiKey()
            ]);

            if (apiKey) {
                setAgentApiKey(apiKey);
            }

            if (settings) {
                setFormData({
                    companyName: settings.companyName,
                    companyEmail: settings.companyEmail,
                    companyAddress: settings.companyAddress || "",
                    companyPhone: settings.companyPhone || "",
                    companyLogo: settings.companyLogo || "",
                    companyWebsite: settings.companyWebsite || "",
                    companyTaxId: settings.companyTaxId || "",
                    paymentInstructions: settings.paymentInstructions || "",
                    currency: settings.currency,
                    defaultTaxRate: settings.defaultTaxRate ?? 13,
                    invoiceTemplate: settings.invoiceTemplate || "modern",
                    quoteTemplate: settings.quoteTemplate || "modern",
                    resendApiKey: settings.resendApiKey || "",
                    stripePublishableKey: settings.stripePublishableKey || "",
                    stripeSecretKey: settings.stripeSecretKey || "",
                    cryptoWalletAddress: settings.cryptoWalletAddress || "",
                    localAiUrl: settings.localAiUrl || "http://localhost:11434/v1",
                    localAiModel: settings.localAiModel || "llama3",
                });
                if (settings.companyLogo) {
                    setLogoPreview(settings.companyLogo);
                }

                // Auto-verify loaded keys (optional, but good UX)
                if (settings.resendApiKey) verifyResend(settings.resendApiKey);
                if (settings.stripeSecretKey) verifyStripe(settings.stripeSecretKey);
            }
            setIsLoading(false);
        }
        loadSettings();
    }, []);

    const verifyResend = async (key: string | undefined) => {
        if (!key) return;
        setVerificationStatus(prev => ({ ...prev, resend: "loading" }));
        const result = await verifyResendConnection(key);
        setVerificationStatus(prev => ({ ...prev, resend: result.success ? "success" : "error" }));
        if (!result.success) {
            toast.error("Resend Verification Failed", { description: result.message });
        }
    };

    const verifyStripe = async (key: string | undefined) => {
        if (!key) return;
        setVerificationStatus(prev => ({ ...prev, stripe: "loading" }));
        const result = await verifyStripeConnection(key);
        setVerificationStatus(prev => ({ ...prev, stripe: result.success ? "success" : "error" }));
        if (!result.success) {
            toast.error("Stripe Verification Failed", { description: result.message });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            toast.error("Image too large", { description: "Please upload an image under 500KB." });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setLogoPreview(base64);
            setFormData((prev) => ({ ...prev, companyLogo: base64 }));
        };
        reader.readAsDataURL(file);
    };

    const removeLogo = () => {
        setLogoPreview(null);
        setFormData((prev) => ({ ...prev, companyLogo: "" }));
    };

    const handleSave = async () => {
        if (!formData.companyName || !formData.companyEmail) {
            toast.error("Missing fields", { description: "Company name and email are required." });
            return;
        }
        setIsSaving(true);
        try {
            const result = await createSettings(formData);
            if (result.success) {
                toast.success("Settings saved!");
                router.refresh();
            } else {
                toast.error("Failed to save", { description: result.message });
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveApiKeys = async () => {
        // Validation
        if (formData.resendApiKey && !formData.resendApiKey.startsWith("re_")) {
            toast.error("Invalid Resend API Key", { description: "Must start with 're_'" });
            return;
        }
        if (formData.stripePublishableKey && !formData.stripePublishableKey.startsWith("pk_")) {
            toast.error("Invalid Stripe Publishable Key", { description: "Must start with 'pk_'" });
            return;
        }
        if (formData.stripeSecretKey && !formData.stripeSecretKey.startsWith("sk_") && !formData.stripeSecretKey.startsWith("rk_")) {
            toast.error("Invalid Stripe Secret Key", { description: "Must start with 'sk_' or 'rk_'" });
            return;
        }

        setIsSaving(true);
        try {
            const result = await createSettings(formData);
            if (result.success) {
                toast.success("API Configuration Saved", {
                    description: "Your API keys have been securely updated."
                });
                router.refresh();

                // Re-verify after saving
                if (formData.resendApiKey) verifyResend(formData.resendApiKey);
                if (formData.stripeSecretKey) verifyStripe(formData.stripeSecretKey);
            } else {
                toast.error("Failed to save API keys");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateApiKey = async () => {
        setIsGeneratingKey(true);
        try {
            const result = await generateApiKey();
            if (result.success && result.apiKey) {
                setAgentApiKey(result.apiKey);
                toast.success("Agent API Key Generated");
            } else {
                toast.error("Failed to generate key");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const handleRevokeApiKey = async () => {
        if (!confirm("Are you sure? This will disconnect any agents using this key.")) return;

        setIsGeneratingKey(true);
        try {
            const result = await revokeApiKey();
            if (result.success) {
                setAgentApiKey(null);
                toast.success("Agent API Key Revoked");
            } else {
                toast.error("Failed to revoke key");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const [isSavingAi, setIsSavingAi] = useState(false);

    const handleSaveAiSettings = async () => {
        setIsSavingAi(true);
        try {
            const { saveLocalAiSettings } = await import("@/app/actions/ai");
            const result = await saveLocalAiSettings(formData.localAiUrl || "", formData.localAiModel || "");
            if (result.success) {
                toast.success("AI Configuration Saved");
                router.refresh();
            } else {
                toast.error("Failed to save AI settings", { description: result.message });
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsSavingAi(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Customize the look and feel of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Label>Theme</Label>
                            <p className="text-sm text-muted-foreground">Select your preferred theme.</p>
                        </div>
                        <ModeToggle />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Company Logo</CardTitle>
                    <CardDescription>
                        Upload your company logo. It will appear in the sidebar and on invoices/quotes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        {logoPreview ? (
                            <div className="relative">
                                <img
                                    src={logoPreview}
                                    alt="Company logo"
                                    className="h-20 w-20 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center">
                                <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <Label htmlFor="logo-upload" className="cursor-pointer">
                                <Button variant="outline" asChild>
                                    <span>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {logoPreview ? "Change Logo" : "Upload Logo"}
                                    </span>
                                </Button>
                            </Label>
                            <Input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG up to 500KB</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Templates</CardTitle>
                    <CardDescription>
                        Choose the layout and style for your documents.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-sm">Visual Template Builder</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Customize your invoice colors, fonts, and layout with a real-time preview.
                            </p>
                        </div>
                        <InteractiveButton onClick={() => router.push("/settings/templates")}>
                            Launch Builder
                        </InteractiveButton>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>API Configuration</CardTitle>
                    <CardDescription>
                        Manage your third-party service integrations. Leaving these blank will use values from your .env file.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="resendApiKey">Resend API Key</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="resendApiKey"
                                    type={showKeys.resend ? "text" : "password"}
                                    value={formData.resendApiKey}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, resendApiKey: e.target.value }));
                                        setVerificationStatus(prev => ({ ...prev, resend: "idle" }));
                                    }}
                                    placeholder="re_..."
                                    className={cn(
                                        formData.resendApiKey && !formData.resendApiKey.startsWith("re_") && "border-destructive focus-visible:ring-destructive",
                                        verificationStatus.resend === "success" && "border-green-500 focus-visible:ring-green-500",
                                        verificationStatus.resend === "error" && "border-destructive focus-visible:ring-destructive"
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowKeys(prev => ({ ...prev, resend: !prev.resend }))}
                                >
                                    {showKeys.resend ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => verifyResend(formData.resendApiKey)}
                                disabled={!formData.resendApiKey || !formData.resendApiKey.startsWith("re_") || verificationStatus.resend === "loading"}
                                title="Test Connection"
                            >
                                {verificationStatus.resend === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                    verificationStatus.resend === "success" ? <Check className="h-4 w-4 text-green-500" /> :
                                        verificationStatus.resend === "error" ? <X className="h-4 w-4 text-destructive" /> :
                                            <Zap className="h-4 w-4" />}
                            </Button>
                        </div>
                        {formData.resendApiKey && !formData.resendApiKey.startsWith("re_") && (
                            <p className="text-[0.8rem] text-destructive">Invalid format. Must start with 're_'.</p>
                        )}
                        {verificationStatus.resend === "success" && <p className="text-[0.8rem] text-green-500">Connection Verified</p>}
                        {verificationStatus.resend === "error" && <p className="text-[0.8rem] text-destructive">Connection Failed</p>}
                        <p className="text-[0.8rem] text-muted-foreground">Used for sending emails.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                        <div className="relative">
                            <Input
                                id="stripePublishableKey"
                                type={showKeys.stripePub ? "text" : "password"}
                                value={formData.stripePublishableKey}
                                onChange={(e) => setFormData((prev) => ({ ...prev, stripePublishableKey: e.target.value }))}
                                placeholder="pk_test_..."
                                className={cn(
                                    formData.stripePublishableKey && !formData.stripePublishableKey.startsWith("pk_") && "border-destructive focus-visible:ring-destructive",
                                    formData.stripePublishableKey && formData.stripePublishableKey.startsWith("pk_") && "border-green-500 focus-visible:ring-green-500"
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowKeys(prev => ({ ...prev, stripePub: !prev.stripePub }))}
                            >
                                {showKeys.stripePub ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                        </div>
                        {formData.stripePublishableKey && !formData.stripePublishableKey.startsWith("pk_") && (
                            <p className="text-[0.8rem] text-destructive">Invalid format. Must start with 'pk_'.</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    id="stripeSecretKey"
                                    type={showKeys.stripeSec ? "text" : "password"}
                                    value={formData.stripeSecretKey}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, stripeSecretKey: e.target.value }));
                                        setVerificationStatus(prev => ({ ...prev, stripe: "idle" }));
                                    }}
                                    placeholder="sk_test_..."
                                    className={cn(
                                        formData.stripeSecretKey && !formData.stripeSecretKey.startsWith("sk_") && !formData.stripeSecretKey.startsWith("rk_") && "border-destructive focus-visible:ring-destructive",
                                        verificationStatus.stripe === "success" && "border-green-500 focus-visible:ring-green-500",
                                        verificationStatus.stripe === "error" && "border-destructive focus-visible:ring-destructive"
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowKeys(prev => ({ ...prev, stripeSec: !prev.stripeSec }))}
                                >
                                    {showKeys.stripeSec ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => verifyStripe(formData.stripeSecretKey)}
                                disabled={!formData.stripeSecretKey || (!formData.stripeSecretKey.startsWith("sk_") && !formData.stripeSecretKey.startsWith("rk_")) || verificationStatus.stripe === "loading"}
                                title="Test Connection"
                            >
                                {verificationStatus.stripe === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                    verificationStatus.stripe === "success" ? <Check className="h-4 w-4 text-green-500" /> :
                                        verificationStatus.stripe === "error" ? <X className="h-4 w-4 text-destructive" /> :
                                            <Zap className="h-4 w-4" />}
                            </Button>
                        </div>
                        {formData.stripeSecretKey && !formData.stripeSecretKey.startsWith("sk_") && !formData.stripeSecretKey.startsWith("rk_") && (
                            <p className="text-[0.8rem] text-destructive">Invalid format. Must start with 'sk_' or 'rk_'.</p>
                        )}
                        {verificationStatus.stripe === "success" && <p className="text-[0.8rem] text-green-500">Connection Verified</p>}
                        {verificationStatus.stripe === "error" && <p className="text-[0.8rem] text-destructive">Connection Failed</p>}
                        <p className="text-[0.8rem] text-muted-foreground">Used for generating payment links.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cryptoWalletAddress">USDC Wallet Address (Polygon/ETH)</Label>
                        <Input
                            id="cryptoWalletAddress"
                            placeholder="0x..."
                            value={formData.cryptoWalletAddress}
                            onChange={(e) => setFormData((prev) => ({ ...prev, cryptoWalletAddress: e.target.value }))}
                            className="font-mono"
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Enter your wallet address to accept crypto payments. A QR code will be added to invoices.
                        </p>
                    </div>
                    <InteractiveButton
                        onClick={handleSaveApiKeys}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                    >
                        {isSaving ? "Saving Keys..." : "Save API Configuration"}
                    </InteractiveButton>
                </CardContent>
            </Card>



            <Card>
                <CardHeader>
                    <CardTitle>Local AI Configuration</CardTitle>
                    <CardDescription>
                        Connect to a locally running LLM (e.g., Ollama, LM Studio) for private AI features.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="localAiUrl">Base URL</Label>
                        <div className="flex flex-col gap-2">
                            <Input
                                id="localAiUrl"
                                value={formData.localAiUrl}
                                onChange={(e) => setFormData((prev) => ({ ...prev, localAiUrl: e.target.value }))}
                                placeholder="http://localhost:11434"
                                className="font-mono"
                            />
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setFormData(prev => ({ ...prev, localAiUrl: "http://localhost:11434" }))}
                                >
                                    Ollama (Local)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setFormData(prev => ({ ...prev, localAiUrl: "http://localhost:1234" }))}
                                >
                                    LM Studio
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setFormData(prev => ({ ...prev, localAiUrl: "http://127.0.0.1:1234" }))}
                                >
                                    LM Studio (Alt)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setFormData(prev => ({ ...prev, localAiUrl: "http://localhost:8080" }))}
                                >
                                    LocalAI
                                </Button>
                            </div>
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            The base URL of your local inference server. OpenAI-compatible APIs are supported.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="localAiModel">Model Name</Label>
                        <div className="flex gap-2">
                            <Input
                                id="localAiModel"
                                value={formData.localAiModel}
                                onChange={(e) => setFormData((prev) => ({ ...prev, localAiModel: e.target.value }))}
                                placeholder="llama3"
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                type="button"
                                onClick={async () => {
                                    const { testLocalAiConnection } = await import("@/app/actions/ai");
                                    const toastId = toast.loading("Testing connection...");
                                    const result = await testLocalAiConnection(formData.localAiUrl || "", formData.localAiModel || "");

                                    if (result.success) {
                                        toast.success("Connection Successful", {
                                            id: toastId,
                                            description: `Server replied: "${result.data.reply}"`
                                        });
                                    } else {
                                        toast.error("Connection Failed", {
                                            id: toastId,
                                            description: result.message,
                                            duration: 5000
                                        });
                                    }
                                }}
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Test Connection
                            </Button>
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Usually 'llama3', 'mistral', or the specific binary name in LM Studio.
                        </p>
                    </div>
                    <InteractiveButton
                        onClick={handleSaveAiSettings}
                        disabled={isSavingAi}
                        className="w-full sm:w-auto"
                    >
                        {isSavingAi ? "Saving..." : "Save AI Configuration"}
                    </InteractiveButton>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>
                        Update your company details for invoices and quotes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                            id="companyName"
                            value={formData.companyName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                            placeholder="Your Company Ltd"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="companyEmail">Email *</Label>
                        <Input
                            id="companyEmail"
                            type="email"
                            value={formData.companyEmail}
                            onChange={(e) => setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))}
                            placeholder="billing@company.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="companyAddress">Address</Label>
                        <Input
                            id="companyAddress"
                            value={formData.companyAddress}
                            onChange={(e) => setFormData((prev) => ({ ...prev, companyAddress: e.target.value }))}
                            placeholder="123 Business St"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="companyPhone">Phone</Label>
                        <Input
                            id="companyPhone"
                            value={formData.companyPhone}
                            onChange={(e) => setFormData((prev) => ({ ...prev, companyPhone: e.target.value }))}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="companyWebsite">Website</Label>
                        <Input
                            id="companyWebsite"
                            value={formData.companyWebsite}
                            onChange={(e) => setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))}
                            placeholder="https://yourcompany.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="companyTaxId">Tax ID / VAT Number</Label>
                        <Input
                            id="companyTaxId"
                            value={formData.companyTaxId}
                            onChange={(e) => setFormData((prev) => ({ ...prev, companyTaxId: e.target.value }))}
                            placeholder="T-12345678"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                        <Input
                            id="paymentInstructions"
                            value={formData.paymentInstructions}
                            onChange={(e) => setFormData((prev) => ({ ...prev, paymentInstructions: e.target.value }))}
                            placeholder="Bank Transfer: Account #..., SWIFT: ..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                        <Input
                            id="defaultTaxRate"
                            type="number"
                            step="0.01"
                            value={formData.defaultTaxRate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) || 0 }))}
                            placeholder="13"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Currency</Label>
                        <Select
                            value={formData.currency}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
                        >
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
                    </div>
                    <InteractiveButton onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </InteractiveButton>
                </CardContent>
            </Card>



            <Card>
                <CardHeader>
                    <CardTitle>AI Agent Access</CardTitle>
                    <CardDescription>
                        Manage access for personal AI agents like Picoclaw or Openclaw.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Agent API Key</Label>
                        <div className="flex gap-2">
                            {agentApiKey ? (
                                <>
                                    <div className="relative flex-1">
                                        <Input
                                            value={agentApiKey}
                                            readOnly
                                            type={showAgentKey ? "text" : "password"}
                                            className="font-mono"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                            onClick={() => setShowAgentKey(!showAgentKey)}
                                        >
                                            {showAgentKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            navigator.clipboard.writeText(agentApiKey);
                                            toast.success("Copied to clipboard");
                                        }}
                                        title="Copy Key"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={handleRevokeApiKey}
                                        disabled={isGeneratingKey}
                                        title="Revoke Key"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </>
                            ) : (
                                <InteractiveButton
                                    onClick={handleGenerateApiKey}
                                    disabled={isGeneratingKey}
                                >
                                    {isGeneratingKey ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Generate New Key
                                        </>
                                    )}
                                </InteractiveButton>
                            )}
                        </div>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Provide this key to your AI agent along with the{" "}
                            <a href="/api/docs/openapi.json" target="_blank" className="underline hover:text-primary">
                                OpenAPI Specification
                            </a>
                            .
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        Permanent actions that cannot be undone. Use with extreme caution.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                        <div className="space-y-1">
                            <h4 className="text-sm font-semibold">Purge All Application Data</h4>
                            <p className="text-sm text-muted-foreground">
                                Clear all clients, invoices, quotes, and expenses. Your settings will be kept.
                            </p>
                        </div>
                        <PurgeDataAction />
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
