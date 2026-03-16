"use server";

// Auth is now handled by Clerk.
// Registration and login are managed through Clerk's hosted UI.
// This file is kept for backward compatibility with any imports.

export async function register() {
  return { error: "Registration is handled by Clerk. Use /sign-up instead." };
}

export async function login() {
  return { error: "Login is handled by Clerk. Use /sign-in instead." };
}
