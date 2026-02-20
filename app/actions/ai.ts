"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

interface AiResponse {
    success: boolean;
    message?: string;
    data?: any;
}

async function getRequiredSession() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        throw new Error("Unauthorized");
    }
    return { userId };
}

/**
 * Normalizes the AI base URL to ensure it has the /v1 suffix if required.
 */
function normalizeAiUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    let normalized = url.trim().replace(/\/$/, "");

    // If it doesn't end with /v1, append it. 
    // Most local LLM REST APIs (LM Studio, Ollama /v1, LocalAI) expect /v1/chat/completions
    if (!normalized.endsWith("/v1")) {
        normalized = `${normalized}/v1`;
    }
    return normalized;
}

/**
 * Tests the connection to the local AI by attempting to list models or run a simple prompt.
 */
export async function testLocalAiConnection(url: string, model: string): Promise<AiResponse> {
    try {
        const baseUrl = normalizeAiUrl(url);
        if (!baseUrl) return { success: false, message: "Invalid URL" };

        console.log(`[AI] Testing connection to ${baseUrl} with model ${model}`);
        const endpoint = `${baseUrl}/chat/completions`;

        const payload = {
            model: model,
            messages: [{ role: "user", content: "Hello, are you there?" }],
            max_tokens: 10
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[AI] Connection failed:", response.status, errorText);

            // Helpful hints for common errors
            let hint = "";
            if (response.status === 404) hint = " - Check if the base URL and '/v1' suffix are correct.";
            if (response.status === 401) hint = " - Authentication might be required for this endpoint.";

            return {
                success: false,
                message: `Server returned ${response.status}: ${response.statusText}${hint}`
            };
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        if (!reply) {
            return { success: false, message: "Connection successful, but received empty response. Check model name." };
        }

        return {
            success: true,
            message: "Connection successful!",
            data: { reply }
        };

    } catch (error: any) {
        console.error("[AI] Connection error:", error);
        let message = `Connection error: ${error.message}`;
        if (error.name === 'AbortError') message = "Connection timed out (10s). Is the server running?";
        if (error.code === 'ECONNREFUSED') message = "Connection refused. Is the LLM server running on this port?";

        return { success: false, message };
    }
}

/**
 * Saves the Local AI settings for the user.
 */
export async function saveLocalAiSettings(url: string, model: string) {
    const { userId } = await getRequiredSession();
    try {
        // We trim and normalize before saving
        const normalizedUrl = url.trim();
        await prisma.setting.update({
            where: { userId },
            data: {
                localAiUrl: normalizedUrl,
                localAiModel: model.trim()
            }
        });
        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}


/**
 * Generic function to generate text using the user's configured Local AI.
 */
export async function generateText(prompt: string): Promise<string | null> {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    const settings = await prisma.setting.findUnique({
        where: { userId },
        select: { localAiUrl: true, localAiModel: true }
    });

    const baseUrl = normalizeAiUrl(settings?.localAiUrl);
    if (!baseUrl || !settings?.localAiModel) {
        console.warn("[AI] Local AI not configured properly.");
        return null;
    }

    try {
        const endpoint = `${baseUrl}/chat/completions`;

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
