import React, { useState, useEffect } from "react";
import { saveAs } from "file-saver";
import DiagramEditor from "./DiagramEditor";

interface DiagramDisplayProps {
  diagramUrl: string;
  plantUmlCode: string;
  diagramType?: string;
  onClose: () => void;
  onEdit?: () => void;
  repoDetails?: {
    owner: string;
    repo: string;
    diagramType: string;
  };
}

const DiagramDisplay: React.FC<DiagramDisplayProps> = ({
  diagramUrl,
  plantUmlCode,
  diagramType = "class",
  onClose,
  onEdit,
  repoDetails,
}) => {
  const [showCode, setShowCode] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [diagramName, setDiagramName] = useState("");
  const [diagramDescription, setDiagramDescription] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [cleanedCode, setCleanedCode] = useState<string>(plantUmlCode);

  // Clean up the PlantUML code when it's first received
  useEffect(() => {
    const cleaned = cleanupPlantUmlCode(plantUmlCode);
    setCleanedCode(cleaned);
  }, [plantUmlCode]);

  // Function to clean up PlantUML code with potential formatting issues
  const cleanupPlantUmlCode = (code: string): string => {
    if (!code) return code;

    // Remove code fences if present (```plantuml or ```)
    code = code.replace(/^```(?:plantuml)?\n/gm, "");
    code = code.replace(/```$/gm, "");

    // Strip any extra @startuml/@enduml tags in the middle
    code = code.replace(/@enduml\s*@startuml/g, "\n");

    // Ensure there's exactly one @startuml at the beginning
    const startumlCount = (code.match(/@startuml/g) || []).length;
    if (startumlCount > 1) {
      code = code.replace(/@startuml/g, "");
      code = "@startuml\n" + code;
    } else if (startumlCount === 0) {
      code = "@startuml\n" + code;
    }

    // Ensure there's exactly one @enduml at the end
    const endumlCount = (code.match(/@enduml/g) || []).length;
    if (endumlCount > 1) {
      code = code.replace(/@enduml/g, "");
      code = code.trim() + "\n@enduml";
    } else if (endumlCount === 0) {
      code = code.trim() + "\n@enduml";
    }

    return code;
  };

  // Generate a fallback image URL from the PlantUML code
  useEffect(() => {
    if (cleanedCode && !fallbackImageUrl) {
      try {
        // This is a backup strategy to generate the image URL directly in the browser
        // This works by encoding the PlantUML code and using the public PlantUML server
        const encoded = encodePlantUmlToUrl(cleanedCode);
        const fallbackUrl = `https://www.plantuml.com/plantuml/img/${encoded}`;
        setFallbackImageUrl(fallbackUrl);
        console.log("Generated fallback image URL:", fallbackUrl);
      } catch (error) {
        console.error("Failed to generate fallback image URL:", error);
      }
    }
  }, [cleanedCode]);

  // Function to encode PlantUML for URL
  const encodePlantUmlToUrl = (umlCode: string): string => {
    // Simple encoding for PlantUML - this is a basic implementation
    // In production, you'd want to use the full PlantUML encoding algorithm
    // For now, we'll use the encoded value that's usually returned with the API response

    // Extract the encoded value from the URL if it exists
    if (diagramUrl && diagramUrl.includes("plantuml")) {
      const match = diagramUrl.match(/\/img\/([^/?]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback to a very basic encoding
    return btoa(umlCode).replace(/\+/g, "-").replace(/\//g, "_");
  };

  // Function to get a potentially proxy URL for the image to handle CORS issues
  const getProxiedImageUrl = (url: string) => {
    // If it's already a data URL, return it as is
    if (url.startsWith("data:")) {
      return url;
    }

    // If the URL is from plantuml.com, use a CORS proxy only if needed
    if (url.includes("plantuml.com")) {
      // Try with the original URL first, fallback to proxy if it fails
      return url;
    }

    return url;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("Failed to load diagram image:", diagramUrl);
    setImageError(true);
    setImageLoaded(false);
  };

  const retryLoadImage = () => {
    setImageError(false);
    // Force reload by appending a random query parameter
    const reloadUrl = `${diagramUrl}${
      diagramUrl.includes("?") ? "&" : "?"
    }reload=${Date.now()}`;
    const img = new Image();
    img.src = reloadUrl;
    img.onload = handleImageLoad;
    img.onerror = handleImageError;
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(diagramUrl);
      const blob = await response.blob();
      saveAs(blob, "uml-diagram.png");
    } catch (error) {
      console.error("Error downloading diagram:", error);
      alert("Failed to download the diagram");
    }
  };

  const downloadPlantUmlCode = () => {
    const blob = new Blob([cleanedCode], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "uml-diagram.puml");
  };

  const toggleSaveForm = () => {
    setShowSaveForm(!showSaveForm);
  };

  const saveDiagram = () => {
    if (!diagramName.trim()) {
      alert("Please enter a name for your diagram");
      return;
    }

    // Create a unique ID
    const diagramId = `diagram_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Create diagram object
    const diagramToSave = {
      id: diagramId,
      name: diagramName,
      description: diagramDescription,
      plantUmlCode: cleanedCode,
      diagramUrl: diagramUrl,
      createdAt: Date.now(),
      repoOwner: repoDetails?.owner || "Unknown",
      repoName: repoDetails?.repo || "Unknown",
      diagramType: repoDetails?.diagramType || "class",
    };

    // Get existing diagrams
    const existingDiagramsJson = localStorage.getItem("savedDiagrams");
    const existingDiagrams = existingDiagramsJson
      ? JSON.parse(existingDiagramsJson)
      : [];

    // Add new diagram and save
    const updatedDiagrams = [diagramToSave, ...existingDiagrams];
    localStorage.setItem("savedDiagrams", JSON.stringify(updatedDiagrams));

    // Reset form
    setDiagramName("");
    setDiagramDescription("");
    setShowSaveForm(false);

    alert("Diagram saved successfully!");
  };

  const openInEditor = () => {
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
  };

  const handleEditorSave = (updatedDiagram: {
    plantUmlCode: string;
    diagramUrl: string;
  }) => {
    // Update the current diagram with the edited version
    // This is a bit of a hack since we can't directly modify props
    window.location.href = updatedDiagram.diagramUrl;
    closeEditor();
  };

  if (showEditor && repoDetails) {
    return (
      <DiagramEditor
        initialDiagram={{
          plantUmlCode: cleanedCode,
          diagramUrl,
        }}
        owner={repoDetails.owner}
        repo={repoDetails.repo}
        token={localStorage.getItem("github_token") || ""}
        diagramType={repoDetails.diagramType}
        onClose={closeEditor}
        onSave={handleEditorSave}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Diagram
          </h2>
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

        {showSaveForm ? (
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              Save Diagram
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagram Name*
                </label>
                <input
                  type="text"
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter a name for your diagram"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={diagramDescription}
                  onChange={(e) => setDiagramDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a description for this diagram"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={toggleSaveForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDiagram}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save Diagram
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4">
            {showCode ? (
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-[60vh]">
                {cleanedCode}
              </pre>
            ) : (
              <div className="flex justify-center flex-col items-center">
                {imageError ? (
                  <div className="text-center p-8">
                    {fallbackImageUrl ? (
                      <div className="mb-4">
                        <p className="text-yellow-600 mb-3">
                          Using alternative rendering method:
                        </p>
                        <img
                          src={fallbackImageUrl}
                          alt="UML Diagram (Fallback)"
                          className="max-w-full object-contain border border-yellow-300 rounded"
                          style={{ maxHeight: "50vh" }}
                        />
                      </div>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-16 w-16 text-red-500 mx-auto mb-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="text-lg font-medium text-gray-800 mb-3">
                          Failed to load diagram image
                        </p>
                        <p className="text-gray-600 mb-4">
                          The diagram was generated but couldn't be displayed.
                        </p>
                      </>
                    )}
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={retryLoadImage}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => setShowCode(true)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        View PlantUML Code
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={getProxiedImageUrl(diagramUrl)}
                    alt="UML Diagram"
                    className="max-w-full object-contain"
                    style={{ maxHeight: "60vh" }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t flex flex-wrap gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
            disabled={showSaveForm}
          >
            {showCode ? "Show Diagram" : "Show PlantUML Code"}
          </button>

          <button
            onClick={downloadImage}
            className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
            disabled={showSaveForm}
          >
            Download PNG
          </button>

          <button
            onClick={downloadPlantUmlCode}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            disabled={showSaveForm}
          >
            Download PlantUML
          </button>

          {repoDetails && (
            <button
              onClick={openInEditor}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
              disabled={showSaveForm}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Open in Editor
            </button>
          )}

          <button
            onClick={toggleSaveForm}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition ml-auto"
            disabled={showSaveForm}
          >
            {showSaveForm ? "Cancel" : "Save Diagram"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagramDisplay;
