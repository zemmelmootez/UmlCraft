import React, { useState, useEffect } from "react";
import { githubService } from "../services/githubService";
import { umlService } from "../services/umlService";
import AiDiagramGenerator from "./AiDiagramGenerator";
import DiagramWorkspace from "./DiagramWorkspace";
import Modal from "./Modal";

interface FileItem {
  name: string;
  path: string;
  type: "dir" | "file";
  size?: number;
}

interface RepositoryExplorerProps {
  owner: string;
  repo: string;
  onClose: () => void;
}

const RepositoryExplorer: React.FC<RepositoryExplorerProps> = ({
  owner,
  repo,
  onClose,
}) => {
  const [currentPath, setCurrentPath] = useState<string>("");
  const [contents, setContents] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showAiGenerator, setShowAiGenerator] = useState<boolean>(false);
  const [showWorkspace, setShowWorkspace] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterExtension, setFilterExtension] = useState<string>("all");

  useEffect(() => {
    fetchRepositoryContents(currentPath);
  }, [owner, repo, currentPath]);

  const fetchRepositoryContents = async (path: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await githubService.getRepoContent(owner, repo, path);

      // Sort contents by type (directories first) and then by name
      const sortedContents = Array.isArray(data)
        ? data
            .map((item: any) => ({
              name: item.name,
              path: item.path,
              type: item.type === "dir" ? "dir" : ("file" as "dir" | "file"),
              size: item.size,
            }))
            .sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === "dir" ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            })
        : [];

      setContents(sortedContents);

      // Update breadcrumbs
      if (path) {
        const pathParts = path.split("/");
        setBreadcrumbs(pathParts);
      } else {
        setBreadcrumbs([]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching repository contents:", error);
      setError("Failed to fetch repository contents");
      setLoading(false);
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentPath("");
    } else {
      const path = breadcrumbs.slice(0, index + 1).join("/");
      setCurrentPath(path);
    }
  };

  const toggleFileSelection = async (file: FileItem) => {
    if (file.type === "dir") {
      navigateToPath(file.path);
      return;
    }

    const newSelectedFiles = new Set(selectedFiles);

    if (newSelectedFiles.has(file.path)) {
      newSelectedFiles.delete(file.path);
    } else {
      newSelectedFiles.add(file.path);
    }

    setSelectedFiles(newSelectedFiles);
  };

  const openAiDiagramGenerator = () => {
    setShowAiGenerator(true);
  };

  const closeAiDiagramGenerator = () => {
    setShowAiGenerator(false);
  };

  const openWorkspace = () => {
    setShowWorkspace(true);
  };

  const closeWorkspace = () => {
    setShowWorkspace(false);
  };

  // Filter files by search query and extension
  const filteredContents = contents.filter((item) => {
    // Apply search filter (case insensitive)
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply extension filter
    const matchesExtension =
      filterExtension === "all" ||
      (item.type === "file" && item.name.endsWith(`.${filterExtension}`));

    // For directories, always include them when no extension filter is applied
    // or when they match the search query
    if (item.type === "dir") {
      return filterExtension === "all" ? matchesSearch : false;
    }

    return matchesSearch && matchesExtension;
  });

  // Count files by extension for filter dropdown options
  const extensionCounts = contents.reduce((acc, item) => {
    if (item.type === "file") {
      const extension = item.name.split(".").pop() || "unknown";
      acc[extension] = (acc[extension] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (loading && contents.length === 0) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchRepositoryContents(currentPath)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">{`${owner}/${repo}`}</h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={openAiDiagramGenerator}
            className="px-4 py-2 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            AI Generator
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-4 p-4 border-b">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="flex items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-neutral-500 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <div className="text-sm font-medium text-neutral-700">
              {currentPath ? (
                <div className="flex items-center overflow-x-auto whitespace-nowrap pb-2">
                  <button
                    onClick={() => navigateToBreadcrumb(-1)}
                    className="hover:text-primary-600 mr-1"
                  >
                    root
                  </button>
                  {breadcrumbs.map((part, index) => (
                    <React.Fragment key={index}>
                      <span className="mx-1 text-neutral-400">/</span>
                      <button
                        onClick={() => navigateToBreadcrumb(index)}
                        className="hover:text-primary-600"
                      >
                        {part}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                "Repository Root"
              )}
            </div>
          </div>
          <div className="relative w-full">
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
              placeholder="Search files..."
              className="pl-10 pr-3 py-2 border border-neutral-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Filter by extension
          </label>
          <select
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filterExtension}
            onChange={(e) => setFilterExtension(e.target.value)}
          >
            <option value="all">All Files</option>
            {Object.entries(extensionCounts).map(([ext, count]) => (
              <option key={ext} value={ext}>
                {ext.toUpperCase()} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-full overflow-hidden">
        {/* File explorer section */}
        <div
          className="w-full md:w-2/3 md:border-r overflow-y-auto p-2"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          {filteredContents.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              {searchQuery || filterExtension !== "all"
                ? "No files match your search filters"
                : "This directory is empty"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredContents.map((item) => (
                <div
                  key={item.path}
                  onClick={() => toggleFileSelection(item)}
                  className={`cursor-pointer p-3 rounded-md flex items-start transition-colors ${
                    selectedFiles.has(item.path)
                      ? "bg-primary-100 border border-primary-300"
                      : "hover:bg-neutral-100 border border-transparent"
                  }`}
                >
                  {item.type === "dir" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-neutral-500 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-neutral-500 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  )}
                  <div className="overflow-hidden">
                    <div className="font-medium text-neutral-800 truncate">
                      {item.name}
                    </div>
                    {item.type === "file" && (
                      <div className="text-xs text-neutral-500">
                        {item.size ? `${Math.round(item.size / 1024)} KB` : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection and AI generator section */}
        <div
          className="w-full md:w-1/3 p-4 overflow-y-auto bg-neutral-50"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-800 mb-2">
              Selected Files ({selectedFiles.size})
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Select files to browse the repository structure
            </p>

            {selectedFiles.size > 0 ? (
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto p-2 border border-neutral-200 rounded-md bg-white">
                {Array.from(selectedFiles).map((filePath) => (
                  <div
                    key={filePath}
                    className="flex items-center justify-between text-sm py-1 px-2 bg-neutral-50 rounded"
                  >
                    <div className="truncate flex-1">{filePath}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelectedFiles = new Set(selectedFiles);
                        newSelectedFiles.delete(filePath);
                        setSelectedFiles(newSelectedFiles);
                      }}
                      className="ml-2 text-neutral-500 hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-neutral-300 bg-white rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mx-auto text-neutral-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="mt-2 text-sm text-neutral-500">
                  Select files to explore the repository
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary-100 p-3 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-primary-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-center text-lg font-semibold text-gray-800 mb-2">
              AI-Powered UML Generation
            </h3>
            <p className="text-center text-gray-600 mb-4">
              Generate comprehensive UML diagrams with our AI-powered system. No
              manual selection needed - our AI analyzes your codebase structure.
            </p>
            <button
              onClick={openAiDiagramGenerator}
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>Generate UML with AI</span>
            </button>
          </div>
        </div>
      </div>

      {showAiGenerator && (
        <Modal
          isOpen={showAiGenerator}
          onClose={closeAiDiagramGenerator}
          maxWidth="900px"
          title="AI-Powered Diagram Generator"
        >
          <AiDiagramGenerator
            owner={owner}
            repo={repo}
            token={githubService.getAccessToken() || ""}
            onClose={closeAiDiagramGenerator}
          />
        </Modal>
      )}

      {showWorkspace && (
        <Modal
          isOpen={showWorkspace}
          onClose={closeWorkspace}
          maxWidth="1100px"
          title="Diagram Workspace"
        >
          <DiagramWorkspace onClose={closeWorkspace} />
        </Modal>
      )}
    </div>
  );
};

export default RepositoryExplorer;
