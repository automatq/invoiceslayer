/**
 * Normalizes the AI base URL to ensure it has the /v1 suffix if required.
 */
export function normalizeAiUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    let normalized = url.trim().replace(/\/$/, "");

    if (!normalized.endsWith("/v1")) {
        normalized = `${normalized}/v1`;
    }
    return normalized;
}

export interface AiResponse {
    success: boolean;
    message?: string;
    data?: any;
}

/**
 * Tests the connection to the local AI from the browser.
 */
export async function testLocalAiConnectionClient(url: string, model: string): Promise<AiResponse> {
    try {
        const baseUrl = normalizeAiUrl(url);
        if (!baseUrl) return { success: false, message: "Invalid URL" };

        const endpoint = `${baseUrl}/chat/completions`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "Hello, are you there?" }],
                max_tokens: 10
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => "No error details");
            let hint = "";
            if (response.status === 404) hint = " - Check if the URL is correct.";
            return { success: false, message: `Server error ${response.status}: ${errorText}${hint}` };
        }

        const data = await response.json();
        return {
            success: true,
            message: "Connection successful!",
            data: { reply: data.choices?.[0]?.message?.content }
        };

    } catch (error: any) {
        console.error("[AI-Client] Connection error:", error);

        if (error.name === 'AbortError') {
            return { success: false, message: "Connection timed out. Is the LLM server running?" };
        }

        // If it's a TypeError, it's often a CORS issue or the server is down
        if (error instanceof TypeError) {
            return {
                success: false,
                message: "Network error. This is likely a CORS issue or the server is unreachable. Check that your LLM server allows requests from this domain."
            };
        }

        return { success: false, message: error.message };
    }
}

/**
 * Client-side text generation.
 */
export async function generateTextClient(settings: { localAiUrl: string; localAiModel: string }, prompt: string): Promise<string | null> {
    const baseUrl = normalizeAiUrl(settings.localAiUrl);
    if (!baseUrl || !settings.localAiModel) return null;

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
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
        console.error("[AI-Client] Generation failed:", error);
        return null;
    }
}
