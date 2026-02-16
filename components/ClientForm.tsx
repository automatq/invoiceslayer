"use client";

import { createClient, updateClient } from "@/app/actions/clients";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X } from "lucide-react";

interface ClientFormProps {
    initialData?: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        address: string | null;
        vatNumber: string | null;
        photo: string | null;
    };
}

export function ClientForm({ initialData }: ClientFormProps) {
    const router = useRouter();
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [globalError, setGlobalError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo || null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 500 * 1024) {
            setGlobalError("Photo must be less than 500KB");
            return;
        }

        if (!file.type.startsWith("image/")) {
            setGlobalError("Please upload an image file");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setPhotoPreview(base64);
            setGlobalError("");
        };
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setPhotoPreview(null);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setErrors({});
        setGlobalError("");

        const formData = new FormData(event.currentTarget);

        // Add the photo base64 to formData
        if (photoPreview) {
            formData.set("photo", photoPreview);
        } else {
            formData.set("photo", "");
        }

        try {
            let result;
            if (initialData) {
                result = await updateClient(initialData.id, formData);
            } else {
                result = await createClient(formData);
            }

            if (result && typeof result === 'object' && 'errors' in result) {
                setErrors(result.errors || {});
                if (result.message) setGlobalError(result.message);
                setIsSubmitting(false);
            } else if (result && typeof result === 'object' && 'message' in result) {
                setGlobalError(result.message);
                setIsSubmitting(false);
            }
        } catch (e: any) {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{initialData ? "Edit Client" : "Client Details"}</CardTitle>
                <CardDescription>
                    {initialData ? "Update the client's information." : "Enter the details of the new client."}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {globalError && (
                        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
                            {globalError}
                        </div>
                    )}

                    {/* Photo Upload */}
                    <div className="grid gap-2">
                        <Label>Client Photo (optional)</Label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {photoPreview ? (
                                    <div className="relative">
                                        <img
                                            src={photoPreview}
                                            alt="Client photo"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={removePhoto}
                                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-muted">
                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <Input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={handlePhotoChange}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG or WebP. Max 500KB.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="name">Client Name</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={initialData?.name}
                            placeholder="Acme Corp"
                            required
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={initialData?.email}
                            placeholder="contact@acme.com"
                            required
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={initialData?.phone || ""}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="vatNumber">GST/HST Number (optional)</Label>
                        <Input
                            id="vatNumber"
                            name="vatNumber"
                            defaultValue={initialData?.vatNumber || ""}
                            placeholder="123456789 RT0001"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Address (optional)</Label>
                        <Textarea
                            id="address"
                            name="address"
                            defaultValue={initialData?.address || ""}
                            placeholder="123 Main St, Anytown, USA"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end mt-4">
                    <Button type="submit" loading={isSubmitting}>
                        {initialData ? "Update Client" : "Save Client"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
