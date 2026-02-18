"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

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

        // After registration, we can sign them in or redirect to login
        return { success: "User created!" };
    } catch (e) {
        return { error: "Something went wrong!" };
    }
}

export async function login(formData: any) {
    try {
        await signIn("credentials", {
            email: formData.email,
            password: formData.password,
            redirectTo: "/",
        });
    } catch (error) {
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
