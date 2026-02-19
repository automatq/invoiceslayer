"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pen, Eraser, Check, Type, Upload } from "lucide-react";

interface SignaturePadProps {
    onSave: (signatureData: string, metadata?: { name?: string; title?: string; company?: string }) => void;
    onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mode, setMode] = useState<"draw" | "type">("draw");
    const [typedSignature, setTypedSignature] = useState("");
    const [signatureFont, setSignatureFont] = useState("cursive");
    const [metadata, setMetadata] = useState({ name: "", title: "", company: "" });

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }, []);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    }, [isDrawing]);

    const stopDrawing = useCallback(() => {
        setIsDrawing(false);
    }, []);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const saveSignature = () => {
        if (mode === "draw") {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Check if canvas is empty
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const isEmpty = imageData.data.every(pixel => pixel === 0);
            
            if (isEmpty) {
                alert("Please draw your signature first");
                return;
            }

            const signatureData = canvas.toDataURL("image/png");
            onSave(signatureData, metadata.name ? metadata : undefined);
        } else {
            if (!typedSignature.trim()) {
                alert("Please type your signature");
                return;
            }

            // Convert typed signature to image
            const canvas = document.createElement("canvas");
            canvas.width = 600;
            canvas.height = 150;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = `48px ${signatureFont}`;
            ctx.fillStyle = "#000";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

            const signatureData = canvas.toDataURL("image/png");
            onSave(signatureData, metadata.name ? metadata : undefined);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Scale image to fit canvas while maintaining aspect ratio
                const scale = Math.min(
                    canvas.width / img.width,
                    canvas.height / img.height,
                    1
                );
                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;
                
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 mb-4">
                <Button
                    type="button"
                    variant={mode === "draw" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("draw")}
                >
                    <Pen className="w-4 h-4 mr-2" />
                    Draw
                </Button>
                <Button
                    type="button"
                    variant={mode === "type" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("type")}
                >
                    <Type className="w-4 h-4 mr-2" />
                    Type
                </Button>
            </div>

            {mode === "draw" ? (
                <Card>
                    <CardContent className="p-4">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={150}
                            className="border border-gray-300 rounded cursor-crosshair touch-none w-full"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        <div className="flex gap-2 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearCanvas}
                            >
                                <Eraser className="w-4 h-4 mr-2" />
                                Clear
                            </Button>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <span>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload
                                    </span>
                                </Button>
                            </label>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <input
                            type="text"
                            placeholder="Type your signature"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            className="w-full p-4 text-3xl text-center border border-gray-300 rounded"
                            style={{ fontFamily: signatureFont }}
                        />
                        <div className="flex gap-2">
                            {["cursive", "serif", "sans-serif"].map((font) => (
                                <Button
                                    key={font}
                                    type="button"
                                    variant={signatureFont === font ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSignatureFont(font)}
                                    style={{ fontFamily: font }}
                                >
                                    {font}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                <h4 className="text-sm font-medium">Signer Information (Optional)</h4>
                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={metadata.name}
                        onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                        className="px-3 py-2 border rounded text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Title"
                        value={metadata.title}
                        onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                        className="px-3 py-2 border rounded text-sm"
                    />
                    <input
                        type="text"
                        placeholder="Company"
                        value={metadata.company}
                        onChange={(e) => setMetadata({ ...metadata, company: e.target.value })}
                        className="px-3 py-2 border rounded text-sm"
                    />
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="button" onClick={saveSignature}>
                    <Check className="w-4 h-4 mr-2" />
                    Sign Document
                </Button>
            </div>
        </div>
    );
}
