import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { githubService } from "../services/githubService";
import logoSvg from "../assets/logo.svg";

interface NavbarProps {
  user?: {
    login: string;
    avatar_url: string;
    name: string | null;
  } | null;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGitHubLogin = () => {
    githubService.initiateOAuth();
  };

  const handleLogout = () => {
    githubService.clearToken();
    window.location.href = "/";
  };

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-sm py-4 relative z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src={logoSvg} alt="UMLCraft Logo" className="h-8 w-8" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              UMLCraft
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "text-primary-600"
                  : "text-neutral-600 hover:text-primary-600"
              }`}
            >
              Home
            </Link>

            {user && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/dashboard"
                    ? "text-primary-600"
                    : "text-neutral-600 hover:text-primary-600"
                }`}
              >
                Dashboard
              </Link>
            )}

            {user && (
              <Link
                to="/saved-diagrams"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/saved-diagrams"
                    ? "text-primary-600"
                    : "text-neutral-600 hover:text-primary-600"
                }`}
              >
                Saved Diagrams
              </Link>
            )}

            <a
              href="https://www.buymeacoffee.com/zemmelmoot7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
              Buy me a coffee
            </a>

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="h-8 w-8 rounded-full ring-2 ring-neutral-100"
                  />
                  <span className="text-sm font-medium text-neutral-700">
                    {user.name || user.login}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-outline text-sm px-4 py-1.5"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={handleGitHubLogin}
                className="btn-primary text-sm"
              >
                Log in with GitHub
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-6 h-6"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 animate-slide-down absolute bg-white w-full left-0 shadow-lg z-40">
            <div className="flex flex-col space-y-4 px-4">
              <Link
                to="/"
                className={`px-2 py-1.5 rounded-md text-sm font-medium ${
                  location.pathname === "/"
                    ? "bg-primary-50 text-primary-600"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              {user && (
                <Link
                  to="/dashboard"
                  className={`px-2 py-1.5 rounded-md text-sm font-medium ${
                    location.pathname === "/dashboard"
                      ? "bg-primary-50 text-primary-600"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              {user && (
                <Link
                  to="/saved-diagrams"
                  className={`px-2 py-1.5 rounded-md text-sm font-medium ${
                    location.pathname === "/saved-diagrams"
                      ? "bg-primary-50 text-primary-600"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Saved Diagrams
                </Link>
              )}

              <a
                href="https://www.buymeacoffee.com/zemmelmoot7"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
                Buy me a coffee
              </a>

              {user ? (
                <>
                  <div className="flex items-center space-x-2 px-2 py-1.5">
                    <img
                      src={user.avatar_url}
                      alt={user.login}
                      className="h-8 w-8 rounded-full ring-2 ring-neutral-100"
                    />
                    <span className="text-sm font-medium text-neutral-700">
                      {user.name || user.login}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-2 py-1.5 rounded-md text-sm font-medium text-primary-600 hover:bg-primary-50 text-left"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGitHubLogin}
                  className="btn-primary text-sm mt-2"
                >
                  Log in with GitHub
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
