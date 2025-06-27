"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { ForgotPasswordForm } from "./components/PasswordReset";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp" | "forgotPassword">("signIn");
  const [submitting, setSubmitting] = useState(false);

  if (flow === "forgotPassword") {
    return <ForgotPasswordForm onBack={() => setFlow("signIn")} />;
  }

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;
          
          // Add flow to formData
          formData.set("flow", flow);
          
          console.log("Attempting authentication:", {
            flow,
            email,
            hasPassword: !!password,
            formDataEntries: Array.from(formData.entries())
          });
          
          void signIn("password", formData)
            .then(() => {
              console.log("Authentication successful");
              toast.success(flow === "signIn" ? "Signed in successfully!" : "Account created successfully!");
            })
            .catch((error) => {
              console.error("Authentication error:", error);
              let toastTitle = "";
              
              // More specific error handling based on actual Convex auth errors
              const errorMessage = error.message || error.toString();
              
              if (errorMessage.includes("Invalid password") || errorMessage.includes("invalid credentials")) {
                toastTitle = "Invalid email or password. Please try again.";
              } else if (errorMessage.includes("Account not found") || errorMessage.includes("User not found")) {
                if (flow === "signIn") {
                  toastTitle = "Account not found. Please sign up first.";
                  // Auto-switch to sign up
                  setTimeout(() => setFlow("signUp"), 2000);
                } else {
                  toastTitle = "Could not create account. Please try again.";
                }
              } else if (errorMessage.includes("Account already exists") || errorMessage.includes("User already exists")) {
                if (flow === "signUp") {
                  toastTitle = "Account already exists. Please sign in instead.";
                  // Auto-switch to sign in
                  setTimeout(() => setFlow("signIn"), 2000);
                } else {
                  toastTitle = "Account exists. Please use sign in.";
                }
              } else if (errorMessage.includes("Missing password")) {
                toastTitle = "Please enter a password.";
              } else if (errorMessage.includes("Invalid email")) {
                toastTitle = "Please enter a valid email address.";
              } else {
                // Generic fallback
                if (flow === "signIn") {
                  toastTitle = "Could not sign in. Try signing up if you don't have an account.";
                } else {
                  toastTitle = "Could not create account. Try signing in if you already have one.";
                }
              }
              
              toast.error(toastTitle);
              setSubmitting(false);
            });
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
        
        {flow === "signIn" && (
          <div className="text-center text-sm">
            <button
              type="button"
              className="text-gray-600 dark:text-slate-400 hover:text-primary hover:underline cursor-pointer"
              onClick={() => setFlow("forgotPassword")}
            >
              Forgot your password?
            </button>
          </div>
        )}
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={() => void signIn("anonymous")}>
        Sign in anonymously
      </button>
    </div>
  );
}
