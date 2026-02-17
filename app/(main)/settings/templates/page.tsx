"use client";

import { useState, useEffect } from "react";
import { InvoicePreview } from "@/components/templates/InvoicePreview";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Button } from "@/components/ui/button";

// ... (existing imports)

// ...


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { saveTemplateSettings, getActiveTemplate } from "@/app/actions/templates";
import { getSettings, getCompanyLogo } from "@/app/actions/settings";
import { toast } from "sonner";
import { Loader2, Palette, Type, LayoutTemplate, Upload, X } from "lucide-react";

export default function TemplateBuilderPage() {
    const [settings, setSettings] = useState({
        name: "My Custom Template",
        color: "#0f172a", // Default slate-900
        font: "inter",
        layout: "modern",
        logoUrl: "",
    });
    const [globalSettings, setGlobalSettings] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                console.log("Fetching settings...");
                const [activeTemplate, companySettings] = await Promise.all([
                    getActiveTemplate(),
                    getSettings()
                ]);

                console.log("Global Settings Fetched");

                if (activeTemplate) {
                    setSettings({
                        name: activeTemplate.name || "Custom Template",
                        color: activeTemplate.color || "#0f172a",
                        font: activeTemplate.font || "inter",
                        layout: activeTemplate.layout || "modern",
                        logoUrl: activeTemplate.logoUrl || "",
                    });
                }

                if (companySettings) {
                    setGlobalSettings(companySettings);
                } else {
                    console.log("No company settings found");
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        }
        loadData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await saveTemplateSettings(settings);
            if (result.success) {
                toast.success("Template saved successfully!");
            } else {
                toast.error("Failed to save template.");
            }
        } catch (e) {
            toast.error("An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const predefinedColors = [
        "#0f172a", // Slate 900 (Default)
        "#2563eb", // Blue 600
        "#dc2626", // Red 600
        "#16a34a", // Green 600
        "#9333ea", // Purple 600
        "#ea580c", // Orange 600
    ];

    return (
        <div className="h-[calc(100vh-4rem)] flex gap-6 p-6">
            {/* Sidebar Controls */}
            <div className="w-80 flex-shrink-0 space-y-6 overflow-y-auto pr-2">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Template Builder</h1>
                    <p className="text-muted-foreground text-sm">Design your invoice verification.</p>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Brand Color
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            {predefinedColors.map((color) => (
                                <button
                                    key={color}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${settings.color === color ? "border-primary scale-110 ring-2 ring-primary/20" : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSettings({ ...settings, color })}
                                />
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Custom Hex Code</Label>
                            <div className="flex gap-2">
                                <div
                                    className="w-10 h-10 rounded border"
                                    style={{ backgroundColor: settings.color }}
                                />
                                <Input
                                    value={settings.color}
                                    onChange={(e) => setSettings({ ...settings, color: e.target.value })}
                                    placeholder="#000000"
                                    maxLength={7}
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Type className="h-4 w-4" /> Typography
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup
                            value={settings.font}
                            onValueChange={(val: string) => setSettings({ ...settings, font: val })}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inter" id="font-inter" />
                                <Label htmlFor="font-inter" className="font-sans">Inter (Default)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="montserrat" id="font-montserrat" />
                                <Label htmlFor="font-montserrat" className="font-montserrat">Montserrat</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="playfair" id="font-playfair" />
                                <Label htmlFor="font-playfair" className="font-playfair">Playfair Display</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="lato" id="font-lato" />
                                <Label htmlFor="font-lato" className="font-lato">Lato</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="roboto-slab" id="font-roboto-slab" />
                                <Label htmlFor="font-roboto-slab" className="font-roboto-slab">Roboto Slab</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="lora" id="font-lora" />
                                <Label htmlFor="font-lora" className="font-lora">Lora</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="serif" id="font-serif" />
                                <Label htmlFor="font-serif" className="font-serif">Standard Serif</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="mono" id="font-mono" />
                                <Label htmlFor="font-mono" className="font-mono">Monospace</Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <LayoutTemplate className="h-4 w-4" /> Layout
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={settings.layout}
                            onValueChange={(val: string) => setSettings({ ...settings, layout: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Layout" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="modern">Modern Card</SelectItem>
                                <SelectItem value="classic">Classic Clean</SelectItem>
                                <SelectItem value="minimal">Minimalist</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Upload className="h-4 w-4" /> Logo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            {settings.logoUrl ? (
                                <div className="relative group">
                                    <img
                                        src={settings.logoUrl}
                                        alt="Logo"
                                        className="h-16 w-16 object-cover rounded-md border"
                                    />
                                    <button
                                        onClick={() => setSettings({ ...settings, logoUrl: "" })}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="h-16 w-16 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                                    <Upload className="h-6 w-6" />
                                </div>
                            )}

                            <div className="flex-1 space-y-2">
                                <Label htmlFor="template-logo-upload" className="cursor-pointer">
                                    <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                                        Upload New
                                        <Input
                                            id="template-logo-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setSettings({ ...settings, logoUrl: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </Label>
                                {globalSettings?.companyLogo && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => setSettings({ ...settings, logoUrl: globalSettings.companyLogo })}
                                    >
                                        Use Company Logo
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <InteractiveButton
                    className="w-full"
                    onClick={handleSave}
                    disabled={isSaving}
                    loading={isSaving}
                    size="sm"
                >
                    Save Template
                </InteractiveButton>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 bg-muted/30 rounded-xl border p-8 overflow-hidden flex flex-col items-center justify-center relative">
                <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-muted-foreground border shadow-sm">
                    Live Preview
                </div>
                <div className="w-full h-full max-w-[800px] shadow-2xl rounded-lg overflow-hidden border bg-card scale-[0.85] origin-top hover:scale-[0.9] transition-transform duration-500">
                    <InvoicePreview settings={{ ...settings, ...globalSettings }} />
                </div>
            </div>
        </div>
    );
}
