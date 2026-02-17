
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface AiResponse {
    success: boolean;
    message?: string;
    data?: any;
}

/**
 * Tests the connection to the local AI by attempting to list models or run a simple prompt.
 */
export async function testLocalAiConnection(url: string, model: string): Promise<AiResponse> {
    try {
        console.log(`[AI] Testing connection to ${url} with model ${model}`);

        // Clean URL: remove trailing slash and /v1 if present to test base, 
        // but for chat completions we usually need /v1/chat/completions
        // Let's assume the user provides the base URL like "http://localhost:11434/v1"

        const endpoint = `${url.replace(/\/$/, "")}/chat/completions`;

        const payload = {
            model: model,
            messages: [{ role: "user", content: "Hello, are you there?" }],
            max_tokens: 10
        };

        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[AI] Connection failed:", response.status, errorText);
            return { success: false, message: `Failed to connect: ${response.status} ${response.statusText}` };
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        return {
            success: true,
            message: "Connection successful!",
            data: { reply }
        };

    } catch (error: any) {
        console.error("[AI] Connection error:", error);
        return { success: false, message: `Connection error: ${error.message}` };
    }
}

/**
 * Saves the Local AI settings to the database.
 */
export async function saveLocalAiSettings(url: string, model: string) {
    try {
        await prisma.setting.updateMany({
            data: {
                localAiUrl: url,
                localAiModel: model
            }
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

/**
 * Generic function to generate text using the configured Local AI.
 */
export async function generateText(prompt: string): Promise<string | null> {
    const settings = await prisma.setting.findFirst();
    if (!settings?.localAiUrl || !settings?.localAiModel) {
        console.warn("[AI] Local AI not configured.");
        return null;
    }

    try {
        const endpoint = `${settings.localAiUrl.replace(/\/$/, "")}/chat/completions`;

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: settings.localAiModel,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;

    } catch (error) {
        console.error("[AI] Generation failed:", error);
        return null;
    }
}
