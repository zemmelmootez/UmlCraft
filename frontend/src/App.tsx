import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SavedDiagramsPage from "./pages/SavedDiagramsPage";
import GitHubCallback from "./components/GitHubCallback";
import NotFoundPage from "./pages/NotFoundPage";
import { githubService } from "./services/githubService";

function App() {
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Log important information for debugging
    console.log("App mounted, environment:", import.meta.env.MODE);
    console.log("Current location:", window.location.href);
    console.log("Base URL:", window.location.origin);
    console.log("Path:", location.pathname);
    console.log("Query:", location.search);

    // Special handler for GitHub OAuth callback in the root path
    // This handles the case where we redirected from /auth/github/callback to / with query params
    if (
      location.pathname === "/" &&
      location.search.includes("code=") &&
      location.search.includes("state=")
    ) {
      const element = document.getElementById("root");
      if (element) {
        // Render the GitHubCallback component directly
        const callbackPath = `/auth/github/callback${location.search}`;
        console.log("Redirecting to callback path:", callbackPath);
        window.history.replaceState({}, "", callbackPath);
      }
    }

    // Validate token on app startup
    const validateToken = async () => {
      if (githubService.isAuthenticated()) {
        try {
          setIsValidatingToken(true);
          const isValid = await githubService.validateToken();

          if (!isValid) {
            console.log("Stored token is invalid, clearing...");
            githubService.clearToken();
          } else {
            console.log("Token validation successful");
          }
        } catch (error) {
          console.error("Error validating token:", error);
          githubService.clearToken();
        } finally {
          setIsValidatingToken(false);
        }
      } else {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [location]);

  return (
    <div
      className="min-h-screen bg-neutral-50 font-sans relative"
      style={{ isolation: "isolate" }}
    >
      {isValidatingToken && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-sm text-neutral-600">
              Validating session...
            </p>
          </div>
        </div>
      )}

      {/* Special handler for GitHub OAuth callback in the root */}
      {location.pathname === "/" &&
      location.search.includes("code=") &&
      location.search.includes("state=") ? (
        <GitHubCallback />
      ) : (
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/saved-diagrams" element={<SavedDiagramsPage />} />
          <Route path="/auth/github/callback" element={<GitHubCallback />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      )}
    </div>
  );
}

export default App;
