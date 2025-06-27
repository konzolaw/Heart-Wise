import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const requestReset = useMutation(api.passwordReset.requestPasswordReset);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    
    const performReset = async () => {
      try {
        const result = await requestReset({ email: email.trim().toLowerCase() });
        if (result.success) {
          setIsSubmitted(true);
          toast.success(result.message);
          
          // For demo purposes, show the reset token/URL
          if (result.token) {
            console.log("Demo Reset URL:", result.resetUrl);
            toast.info(`Demo: Reset URL copied to console (token: ${result.token.substring(0, 10)}...)`, {
              duration: 5000,
            });
          }
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to send reset email");
      } finally {
        setIsLoading(false);
      }
    };
    
    void performReset();
  };

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check Your Email</h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            If an account with that email exists, we've sent you a password reset link.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">🔑</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h2>
        <p className="text-gray-600 dark:text-slate-300 mt-2">
          Enter your email address and we'll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
            placeholder="Enter your email"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
        >
          Back to Sign In
        </button>
      </form>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const tokenValidation = useQuery(api.passwordReset.validateResetToken, { token });
  const resetPassword = useMutation(api.passwordReset.resetPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    
    const performReset = async () => {
      try {
        const result = await resetPassword({ token, newPassword });
        if (result.success) {
          setIsSuccess(true);
          toast.success(result.message);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to reset password");
      } finally {
        setIsLoading(false);
      }
    };
    
    void performReset();
  };

  if (tokenValidation === undefined) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-slate-300 mt-4">Validating reset token...</p>
        </div>
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 dark:text-red-400 text-2xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            {tokenValidation?.message || "This reset link is invalid or has expired."}
          </p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 dark:text-green-400 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Password Reset Complete</h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <a
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            Sign In Now
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Your Password</h2>
        <p className="text-gray-600 dark:text-slate-300 mt-2">
          Enter your new password for {tokenValidation.email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
            placeholder="Enter new password"
            minLength={8}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400"
            placeholder="Confirm new password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
