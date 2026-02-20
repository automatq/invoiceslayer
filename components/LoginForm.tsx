"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { login } from "@/app/actions/auth";
import { toast } from "sonner";
import { SocialLogins } from "@/components/SocialLogins";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InteractiveButton } from "@/components/ui/interactive-button";


// Re-defining internal card components since I am wrapping the form
function CardWrapper({
    children,
    title,
    description,
    googleEnabled,
    githubEnabled
}: {
    children: React.ReactNode,
    title: string,
    description: string,
    googleEnabled: boolean,
    githubEnabled: boolean
}) {
    return (
        <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-xl shadow-2xl w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight text-white">{title}</CardTitle>
                <CardDescription className="text-zinc-500">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {children}
                <SocialLogins googleEnabled={googleEnabled} githubEnabled={githubEnabled} />
                <div className="mt-4 text-center text-sm">
                    <span className="text-zinc-500">Don't have an account? </span>
                    <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                        Register
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
    }),
});

interface LoginFormProps {
    googleEnabled: boolean;
    githubEnabled: boolean;
}

export function LoginForm({ googleEnabled, githubEnabled }: LoginFormProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        startTransition(() => {
            login(values).then((data) => {
                if (data?.error) {
                    toast.error(data.error);
                }
            });
        });
    };

    return (
        <CardWrapper
            title="Login"
            description="Enter your email and password to access your account"
            googleEnabled={googleEnabled}
            githubEnabled={githubEnabled}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-zinc-300">Email</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="john.doe@example.com"
                                        type="email"
                                        className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-zinc-300">Password</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="******"
                                        type="password"
                                        className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-purple-500"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <InteractiveButton
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        {isPending ? "Logging in..." : "Login"}
                    </InteractiveButton>
                </form>
            </Form>
        </CardWrapper>
    );
}

// Internal helper for UI
import { Card as UICard, CardContent as UICardContent, CardDescription as UICardDescription, CardHeader as UICardHeader, CardTitle as UICardTitle } from "@/components/ui/card";
const Card = UICard;
const CardContent = UICardContent;
const CardDescription = UICardDescription;
const CardHeader = UICardHeader;
const CardTitle = UICardTitle;
