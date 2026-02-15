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
import { ModeToggle } from "@/components/mode-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createSettings, getSettings, type SettingsFormValues } from "@/app/actions/settings";
import { Upload, X } from "lucide-react";

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<SettingsFormValues>({
        companyName: "",
        companyEmail: "",
        companyAddress: "",
        companyPhone: "",
        companyLogo: "",
        currency: "USD",
        defaultTaxRate: 13,
        invoiceTemplate: "modern",
        quoteTemplate: "modern",
    });
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        async function loadSettings() {
            const settings = await getSettings();
            if (settings) {
                setFormData({
                    companyName: settings.companyName,
                    companyEmail: settings.companyEmail,
                    companyAddress: settings.companyAddress || "",
                    companyPhone: settings.companyPhone || "",
                    companyLogo: settings.companyLogo || "",
                    currency: settings.currency,
                    defaultTaxRate: settings.defaultTaxRate ?? 13,
                    invoiceTemplate: settings.invoiceTemplate || "modern",
                    quoteTemplate: settings.quoteTemplate || "modern",
                });
                if (settings.companyLogo) {
                    setLogoPreview(settings.companyLogo);
                }
            }
            setIsLoading(false);
        }
        loadSettings();
    }, []);

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
                                <button
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
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
                    <div className="grid gap-2">
                        <Label>Invoice Template</Label>
                        <Select
                            value={formData.invoiceTemplate}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, invoiceTemplate: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select invoice template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="modern">Modern (Recommended)</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="minimalist">Minimalist</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Quote Template</Label>
                        <Select
                            value={formData.quoteTemplate}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, quoteTemplate: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select quote template" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="modern">Modern (Recommended)</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="minimalist">Minimalist</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
