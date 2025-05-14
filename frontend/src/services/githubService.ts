import { Octokit } from "@octokit/rest";
import axios from "axios";

// Hardcoded fallback client ID in case environment variable fails
const FALLBACK_CLIENT_ID = "Ov23liuIob6HCWRHv5sc";

class GitHubService {
  private octokit: Octokit | null = null;
  private accessToken: string | null = null;
  private tokenValidated: boolean = false;

  constructor() {
    // Initialize from local storage if available
    const token = localStorage.getItem("github_token");
    if (token) {
      this.setAccessToken(token);
    }
  }

  setAccessToken(token: string) {
    if (!token) {
      console.error("Attempted to set empty token");
      return;
    }

    this.accessToken = token;
    this.octokit = new Octokit({ auth: token });
    localStorage.setItem("github_token", token);
    this.tokenValidated = false; // Reset validation status when setting a new token
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearToken() {
    this.accessToken = null;
    this.octokit = null;
    this.tokenValidated = false;
    localStorage.removeItem("github_token");
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  isTokenValidated(): boolean {
    return this.tokenValidated;
  }

  async getAuthenticatedUser() {
    if (!this.octokit) {
      throw new Error("Not authenticated");
    }

    try {
      const { data } = await this.octokit.users.getAuthenticated();
      this.tokenValidated = true; // Mark token as validated on successful API call
      return data;
    } catch (error: any) {
      console.error("Failed to get authenticated user:", error);

      // If we get a 401 Unauthorized error, the token is invalid
      if (error.status === 401) {
        this.clearToken(); // Clear the invalid token
      }

      throw error;
    }
  }

  async getUserRepos() {
    if (!this.octokit) {
      throw new Error("Not authenticated");
    }

    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100,
      });

      this.tokenValidated = true; // Mark token as validated on successful API call
      return data;
    } catch (error: any) {
      console.error("Failed to get user repos:", error);

      // If we get a 401 Unauthorized error, the token is invalid
      if (error.status === 401) {
        this.clearToken(); // Clear the invalid token
      }

      throw error;
    }
  }

  async getRepoContent(owner: string, repo: string, path: string = "") {
    if (!this.octokit) {
      throw new Error("Not authenticated");
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      return data;
    } catch (error) {
      console.error(
        `Failed to get repo content for ${owner}/${repo}/${path}:`,
        error
      );
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string) {
    if (!this.octokit) {
      throw new Error("Not authenticated");
    }

    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      if (Array.isArray(data)) {
        throw new Error("Path is a directory, not a file");
      }

      // GitHub API returns base64 encoded content
      if ("content" in data && typeof data.content === "string") {
        return atob(data.content.replace(/\n/g, ""));
      }

      throw new Error("Could not get file content");
    } catch (error) {
      console.error(
        `Failed to get file content for ${owner}/${repo}/${path}:`,
        error
      );
      throw error;
    }
  }

  initiateOAuth() {
    // Clean up any previous auth state
    localStorage.removeItem("github_auth_state");

    // Store state to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("github_auth_state", state);

    // Try to get client ID from environment variables
    let clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

    // If environment variable is missing or malformed, use fallback
    if (!clientId || clientId.includes("=")) {
      console.log("Using fallback client ID");
      clientId = FALLBACK_CLIENT_ID;
    }

    if (!clientId) {
      throw new Error("GitHub Client ID not configured");
    }

    // Use absolute path for the callback URL to avoid subfolder issues
    const baseUrl = window.location.origin;
    const redirectUri = `${baseUrl}/auth/github/callback`;
    const scope = "repo,user"; // Adjust as needed

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&state=${state}`;

    window.location.href = authUrl;
  }

  async exchangeCodeForToken(code: string) {
    try {
      // Get the API URL from environment variables, or default to relative URL for production
      const apiUrl = import.meta.env.VITE_API_URL || "/api";

      const response = await axios.post(
        `${apiUrl}/github/token`,
        { code },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const token = response.data.access_token;
      if (!token) {
        throw new Error("No access token returned from server");
      }

      return token;
    } catch (error) {
      console.error("Failed to exchange code for token:", error);
      throw error;
    }
  }

  // Validate the current token by making a test API call
  async validateToken() {
    if (!this.accessToken) {
      return false;
    }

    try {
      await this.getAuthenticatedUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const githubService = new GitHubService();
