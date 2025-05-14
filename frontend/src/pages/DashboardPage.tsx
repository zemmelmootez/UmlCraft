import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { githubService } from "../services/githubService";
import RepositoryExplorer from "../components/RepositoryExplorer";
import DiagramWorkspace from "../components/DiagramWorkspace";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface User {
  login: string;
  avatar_url: string;
  name: string | null;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showWorkspace, setShowWorkspace] = useState<boolean>(false);
  const [searchRepoQuery, setSearchRepoQuery] = useState<string>("");

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

        // Load repositories
        const reposData = await githubService.getUserRepos();
        setRepos(reposData as Repository[]);

        setLoading(false);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load your data. Please try logging in again.");
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    githubService.clearToken();
    navigate("/");
  };

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const closeRepoExplorer = () => {
    setSelectedRepo(null);
  };

  const openWorkspace = () => {
    setShowWorkspace(true);
  };

  const closeWorkspace = () => {
    setShowWorkspace(false);
  };

  // Filter repositories by search query
  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchRepoQuery.toLowerCase()) ||
      (repo.description &&
        repo.description.toLowerCase().includes(searchRepoQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading your GitHub data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8">
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
            <h3 className="mt-2 text-xl font-medium text-neutral-900">Error</h3>
            <p className="mt-1 text-sm text-neutral-500">{error}</p>
            <div className="mt-6">
              <button onClick={() => navigate("/")} className="btn-primary">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 relative">
      <Navbar user={user} />

      <main
        className="flex-grow container-custom py-8 relative z-10"
        style={{ isolation: "isolate" }}
      >
        {selectedRepo ? (
          <RepositoryExplorer
            owner={selectedRepo.owner.login}
            repo={selectedRepo.name}
            onClose={closeRepoExplorer}
          />
        ) : showWorkspace ? (
          <DiagramWorkspace onClose={closeWorkspace} />
        ) : (
          <>
            <div className="mb-8 flex flex-col md:flex-row justify-between md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                  Your Repositories
                </h1>
                <p className="text-neutral-600">
                  Select a repository to generate UML diagrams
                </p>
              </div>

              <div className="mt-4 md:mt-0 relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search repositories..."
                  className="input pl-10"
                  value={searchRepoQuery}
                  onChange={(e) => setSearchRepoQuery(e.target.value)}
                />
              </div>
            </div>

            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              style={{ position: "relative", zIndex: 20 }}
            >
              {filteredRepos.length > 0
                ? filteredRepos.map((repo) => (
                    <div
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className="card hover:border-primary-500 hover:border relative bg-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      style={{ opacity: 1, position: "relative", zIndex: 30 }}
                    >
                      <h3 className="text-lg font-semibold text-neutral-900 truncate">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-neutral-600 mt-1 mb-4 h-12 overflow-hidden">
                        {repo.description || "No description available"}
                      </p>
                      <div className="flex items-center text-sm text-neutral-500">
                        <img
                          src={repo.owner.avatar_url}
                          alt={repo.owner.login}
                          className="h-6 w-6 rounded-full mr-2 border border-neutral-200"
                        />
                        <span>{repo.owner.login}</span>
                      </div>
                    </div>
                  ))
                : null}
            </div>

            {filteredRepos.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm my-4 relative z-20">
                <svg
                  className="mx-auto h-12 w-12 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-neutral-900">
                  No repositories found
                </h3>
                <p className="mt-1 text-neutral-500">
                  {searchRepoQuery
                    ? `No repositories matching "${searchRepoQuery}"`
                    : "Your GitHub account doesn't have any repositories yet"}
                </p>
                {searchRepoQuery && (
                  <button
                    onClick={() => setSearchRepoQuery("")}
                    className="mt-4 btn-outline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            <div className="mt-12 text-center relative" style={{ zIndex: 20 }}>
              <button onClick={openWorkspace} className="btn-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Open Diagram Workspace
              </button>
            </div>
          </>
        )}
      </main>

      {!selectedRepo && !showWorkspace && <Footer />}
    </div>
  );
};

export default DashboardPage;
