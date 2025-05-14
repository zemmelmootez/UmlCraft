import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { githubService } from "../services/githubService";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DiagramWorkspace from "../components/DiagramWorkspace";

interface User {
  login: string;
  avatar_url: string;
  name: string | null;
}

const SavedDiagramsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!githubService.isAuthenticated()) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        // Load user info
        const userData = await githubService.getAuthenticatedUser();
        setUser(userData as User);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load user data:", err);
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-600">
            Loading your diagrams...
          </p>
        </div>
      </div>
    );
  }

  const handleWorkspaceClose = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 relative">
      <Navbar user={user} />

      <main
        className="flex-grow container-custom py-8 relative z-10"
        style={{ isolation: "isolate" }}
      >
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
            Your Saved Diagrams
          </h1>
          <p className="text-neutral-600">
            View, manage, and export your saved UML diagrams
          </p>
        </div>

        <DiagramWorkspace onClose={handleWorkspaceClose} />
      </main>

      <Footer />
    </div>
  );
};

export default SavedDiagramsPage;
