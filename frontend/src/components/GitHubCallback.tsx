import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { githubService } from "../services/githubService";
import axios from "axios";

const GitHubCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  useEffect(() => {
    // Fix for callback URL asset loading - if we're at /auth/github/callback, redirect to root
    // and preserve query parameters for proper OAuth handling
    if (
      location.pathname === "/auth/github/callback" &&
      window.location.pathname.includes("/auth/github/")
    ) {
      const queryParams = window.location.search;
      window.location.href = `/${queryParams}`;
      return;
    }

    const handleCallback = async () => {
      setIsLoading(true);

      try {
        // Parse query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const state = urlParams.get("state");
        const savedState = localStorage.getItem("github_auth_state");

        console.log("Callback parameters:", {
          codeExists: !!code,
          stateExists: !!state,
          savedStateExists: !!savedState,
          stateMatches: state === savedState,
          retryCount,
        });

        if (!code) {
          setError("No authorization code received from GitHub");
          setIsLoading(false);
          return;
        }

        if (!state || state !== savedState) {
          setError("Invalid OAuth state - possible security issue");
          setIsLoading(false);
          return;
        }

        try {
          console.log("Exchanging code for token...");

          // Never use localhost in production!
          // Get the proper API URL based on the current environment
          let apiUrl;
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          ) {
            // Local development
            apiUrl = "http://localhost:3001/api";
            console.log("Using local development API URL:", apiUrl);
          } else {
            // Production - use the same origin
            apiUrl = `${window.location.origin}/api`;
            console.log("Using production API URL:", apiUrl);
          }

          // For debugging in production
          console.log("Code:", code ? code.substring(0, 5) + "..." : "missing");
          console.log("State validation:", state === savedState);

          // First try the debug endpoint to make sure the server is responsive
          try {
            console.log("Testing debug endpoint...");
            const debugResponse = await axios.post(
              `${apiUrl}/debug/token`,
              { code, test: true },
              {
                headers: {
                  "Content-Type": "application/json",
                },
                timeout: 5000, // 5 seconds
              }
            );

            console.log(
              "Debug endpoint response:",
              debugResponse.status,
              debugResponse.data
            );

            // Now try the real token exchange
            console.log("Proceeding to real token exchange...");
          } catch (debugError) {
            console.error("Debug endpoint failed:", debugError);
            console.log("Trying real endpoint anyway...");
          }

          // Use our server to exchange the code for a token
          const response = await axios.post(
            `${apiUrl}/github/token`,
            { code },
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 10000, // 10 seconds
            }
          );

          if (response.data.access_token) {
            console.log("Authentication successful!");
            localStorage.setItem("github_token", response.data.access_token);
            githubService.setAccessToken(response.data.access_token);

            // Verify token works by making a test API call
            try {
              await githubService.getAuthenticatedUser();
              navigate("/dashboard");
            } catch (verifyError) {
              console.error("Token verification failed:", verifyError);

              // Clear invalid token
              githubService.clearToken();

              if (retryCount < MAX_RETRIES) {
                setRetryCount((count) => count + 1);
                // Restart OAuth flow
                githubService.initiateOAuth();
              } else {
                setError(
                  "Failed to verify GitHub token after multiple attempts. Please try again later."
                );
                setIsLoading(false);
              }
            }
          } else {
            console.error("No access token in response:", response.data);
            setError("Failed to get access token - no token returned");
            setIsLoading(false);
          }
        } catch (error: any) {
          console.error("Token exchange failed:", error);
          console.error("Error response:", error.response?.data);
          const errorMessage =
            error.response?.data?.error || "Failed to exchange code for token";

          if (retryCount < MAX_RETRIES) {
            console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
            setRetryCount((count) => count + 1);
            // Small delay before retry
            setTimeout(() => {
              handleCallback();
            }, 1000);
          } else {
            setError(`Authentication failed: ${errorMessage}`);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Callback handling error:", error);

        if (retryCount < MAX_RETRIES) {
          console.log(`Retry attempt ${retryCount + 1}/${MAX_RETRIES}`);
          setRetryCount((count) => count + 1);
          // Small delay before retry
          setTimeout(() => {
            handleCallback();
          }, 1000);
        } else {
          setError(
            "Failed to complete authentication after multiple attempts."
          );
          setIsLoading(false);
        }
      }
    };

    handleCallback();
  }, [navigate, retryCount, location.pathname]);

  const tryAgain = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
    githubService.initiateOAuth();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-xl font-medium text-gray-900">
              Authentication Error
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={tryAgain}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center px-4 py-2 border border-neutral-300 text-sm font-medium rounded-md shadow-sm text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          Completing GitHub authentication
          {retryCount > 0 ? ` (attempt ${retryCount + 1})` : ""}...
        </p>
      </div>
    </div>
  );
};

export default GitHubCallback;
