import React, { useState, useEffect } from "react";
import DiagramDisplay from "./DiagramDisplay";
import { DiagramType } from "../services/umlService";

interface SavedDiagram {
  id: string;
  name: string;
  description: string;
  repoName: string;
  repoOwner: string;
  diagramType: DiagramType;
  plantUmlCode: string;
  diagramUrl: string;
  createdAt: number;
}

interface DiagramWorkspaceProps {
  onClose: () => void;
}

const DiagramWorkspace: React.FC<DiagramWorkspaceProps> = ({ onClose }) => {
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<SavedDiagram | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    // Load saved diagrams from localStorage
    const loadSavedDiagrams = () => {
      const diagramsJson = localStorage.getItem("savedDiagrams");
      if (diagramsJson) {
        const diagrams = JSON.parse(diagramsJson);
        setSavedDiagrams(diagrams);
      }
    };

    loadSavedDiagrams();
  }, []);

  const viewDiagram = (diagram: SavedDiagram) => {
    setSelectedDiagram(diagram);
  };

  const closeDiagramView = () => {
    setSelectedDiagram(null);
  };

  const deleteDiagram = (diagramId: string) => {
    const updatedDiagrams = savedDiagrams.filter((d) => d.id !== diagramId);
    setSavedDiagrams(updatedDiagrams);
    localStorage.setItem("savedDiagrams", JSON.stringify(updatedDiagrams));
  };

  const filteredDiagrams = savedDiagrams
    .filter((diagram) => {
      // Apply search query to name, description, and repo
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        diagram.name.toLowerCase().includes(searchLower) ||
        diagram.description.toLowerCase().includes(searchLower) ||
        diagram.repoName.toLowerCase().includes(searchLower) ||
        diagram.repoOwner.toLowerCase().includes(searchLower);

      // Apply type filter
      const matchesType =
        filterType === "all" || diagram.diagramType === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          Diagram Workspace
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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

      <div className="p-4 border-b space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Diagrams
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, description or repository"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Type
            </label>
            <select
              id="filter"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="class">Class Diagrams</option>
              <option value="sequence">Sequence Diagrams</option>
              <option value="activity">Activity Diagrams</option>
              <option value="component">Component Diagrams</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredDiagrams.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || filterType !== "all"
              ? "No diagrams match your search filters"
              : "You haven't saved any diagrams yet. Generate and save diagrams to see them here."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDiagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-3 border-b bg-gray-50">
                  <h3 className="font-medium text-gray-800 mb-1 truncate">
                    {diagram.name}
                  </h3>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>
                      {diagram.repoOwner}/{diagram.repoName}
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 rounded-full px-2 py-0.5">
                      {diagram.diagramType}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {diagram.description || "No description provided."}
                  </p>
                  <div className="text-xs text-gray-500 mb-3">
                    Created {new Date(diagram.createdAt).toLocaleString()}
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => viewDiagram(diagram)}
                      className="text-sm px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteDiagram(diagram.id)}
                      className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDiagram && (
        <DiagramDisplay
          diagramUrl={selectedDiagram.diagramUrl}
          plantUmlCode={selectedDiagram.plantUmlCode}
          diagramType={selectedDiagram.diagramType}
          onClose={closeDiagramView}
        />
      )}
    </div>
  );
};

export default DiagramWorkspace;
