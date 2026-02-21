"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

/**
 * Check if an error is a Next.js redirect error
 * These errors should be re-thrown so Next.js can handle the redirect
 */
function isRedirectError(error: any): boolean {
    return !!(
        error &&
        typeof error === "object" &&
        (error.digest?.startsWith("NEXT_REDIRECT") || error.message === "NEXT_REDIRECT")
    );
}
const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
});

export async function register(formData: z.infer<typeof RegisterSchema>) {
    const validatedFields = RegisterSchema.safeParse(formData);

    if (!validatedFields.success) {
        return { error: "Invalid fields!" };
    }

    const { email, password, name } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Email already in use!" };
    }

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        // Automatically sign in the user after registration
        await signIn("credentials", {
            email,
            password,
            redirectTo: "/onboarding",
        });

        return { success: "User created!" };
    } catch (e) {
        if (isRedirectError(e)) throw e;
        if (e instanceof AuthError) {
            return { error: "Something went wrong during sign in." };
        }
        console.error('[register] Error creating user:', e);
        return { error: "Something went wrong!" };
    }
}

export async function login(formData: { email: string; password: string }) {
    try {
        await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirectTo: "/",
        });
    } catch (error) {
        if (isRedirectError(error)) throw error;
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid credentials!" };
                default:
                    return { error: "Something went wrong!" };
            }
        }

        throw error;
    }
}
