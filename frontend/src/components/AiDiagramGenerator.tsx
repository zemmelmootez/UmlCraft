import React, { useState } from "react";
import { umlService, DiagramType } from "../services/umlService";
import DiagramDisplay from "./DiagramDisplay";
import DiagramEditor from "./DiagramEditor";
import Modal from "./Modal";

interface AiDiagramGeneratorProps {
  owner: string;
  repo: string;
  token: string;
  onClose: () => void;
}

const AiDiagramGenerator: React.FC<AiDiagramGeneratorProps> = ({
  owner,
  repo,
  token,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [diagramResult, setDiagramResult] = useState<any>(null);
  const [selectedDiagramType, setSelectedDiagramType] =
    useState<DiagramType>("class");
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [showAdvancedOptions, setShowAdvancedOptions] =
    useState<boolean>(false);
  const [focusContext, setFocusContext] = useState<string>("");

  const generateDiagram = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;

      // Use focused endpoint if context is provided
      if (focusContext && focusContext.trim() !== "") {
        result = await umlService.generateAiUmlDiagramWithFocus({
          owner,
          repo,
          token,
          diagramType: selectedDiagramType,
          focusContext: focusContext,
        });
      } else {
        result = await umlService.generateAiUmlDiagram({
          owner,
          repo,
          token,
          diagramType: selectedDiagramType,
        });
      }

      setDiagramResult(result);
      setLoading(false);
    } catch (error: any) {
      console.error("Error generating AI diagram:", error);
      setError(error.response?.data?.error || "Failed to generate diagram");
      setLoading(false);
    }
  };

  const closeDiagram = () => {
    setDiagramResult(null);
  };

  const openEditor = () => {
    console.log("Opening diagram editor with:", {
      plantUmlCode: diagramResult?.plantUmlCode,
      diagramUrl: diagramResult?.diagramUrl || diagramResult?.url,
      selectedDiagramType,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
  };

  const handleEditorSave = (updatedDiagram: {
    plantUmlCode: string;
    diagramUrl: string;
  }) => {
    console.log("Editor save handler called with:", updatedDiagram);
    setDiagramResult({
      ...diagramResult,
      plantUmlCode: updatedDiagram.plantUmlCode,
      diagramUrl: updatedDiagram.diagramUrl,
    });
    setShowEditor(false);
  };

  const toggleAdvancedOptions = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  // Function to save the diagram
  const saveDiagram = () => {
    const diagram = {
      id: Date.now().toString(),
      name: `${repo} ${selectedDiagramType} diagram`,
      description: `AI-generated ${selectedDiagramType} diagram for ${owner}/${repo}`,
      repoName: repo,
      repoOwner: owner,
      diagramType: selectedDiagramType,
      plantUmlCode: diagramResult.plantUmlCode,
      diagramUrl: diagramResult.diagramUrl || diagramResult.url,
      createdAt: Date.now(),
    };

    const savedDiagrams = JSON.parse(
      localStorage.getItem("savedDiagrams") || "[]"
    );
    savedDiagrams.push(diagram);
    localStorage.setItem("savedDiagrams", JSON.stringify(savedDiagrams));

    alert("Diagram saved successfully!");
  };

  // Function to download PlantUML code
  const downloadPlantUML = () => {
    const plantUmlCode = diagramResult.plantUmlCode;
    const element = document.createElement("a");
    const file = new Blob([plantUmlCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${repo}_${selectedDiagramType}_diagram.puml`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Function to download PNG image
  const downloadPNG = () => {
    try {
      const imgSrc = diagramResult.diagramUrl || diagramResult.url;

      // Create an anchor element and use the download attribute
      const link = document.createElement("a");
      link.download = `${repo}_${selectedDiagramType}_diagram.png`;

      // Instead of canvas approach, fetch the image directly
      fetch(imgSrc)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        })
        .catch((error) => {
          console.error("Error downloading PNG:", error);
          alert("Failed to download PNG. Please try again.");
        });
    } catch (error) {
      console.error("Error initiating PNG download:", error);
      alert("Failed to download PNG. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-lg w-full">
      <div className="p-6">
        {showEditor ? (
          <DiagramEditor
            initialDiagram={diagramResult}
            owner={owner}
            repo={repo}
            token={token}
            diagramType={selectedDiagramType}
            onClose={closeEditor}
            onSave={handleEditorSave}
          />
        ) : diagramResult ? (
          <div className="pb-6">
            <div className="relative border border-gray-200 rounded-lg overflow-hidden mb-6 bg-white">
              <img
                src={diagramResult.diagramUrl || diagramResult.url}
                alt={`${selectedDiagramType} diagram`}
                className="w-full h-auto object-contain max-h-[60vh]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={downloadPlantUML}
                className="py-3 px-4 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center justify-center gap-2 transition-colors"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Download PlantUML Code</span>
              </button>

              <button
                onClick={downloadPNG}
                className="py-3 px-4 bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center justify-center gap-2 transition-colors"
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Download PNG Image</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={() => {
                  setDiagramResult(null);
                  setShowEditor(false);
                }}
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors order-2 sm:order-1"
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
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Generate New Diagram</span>
              </button>

              <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                <button
                  onClick={saveDiagram}
                  className="py-2 px-4 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 flex items-center justify-center gap-2 transition-colors"
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
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  <span>Save Diagram</span>
                </button>

                <button
                  onClick={openEditor}
                  className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit Diagram</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
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
                <h3 className="text-lg font-medium">
                  Repository:{" "}
                  <span className="text-indigo-600">
                    {owner}/{repo}
                  </span>
                </h3>
              </div>
              <p className="text-gray-600 ml-7">
                Our AI will analyze your code and generate a UML diagram based
                on your selection.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Select Diagram Type
              </label>
              <div className="relative">
                <select
                  value={selectedDiagramType}
                  onChange={(e) =>
                    setSelectedDiagramType(e.target.value as DiagramType)
                  }
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white pr-10"
                >
                  <option value="class">
                    Class Diagram - Shows classes, attributes, methods, and
                    relationships
                  </option>
                  <option value="sequence">
                    Sequence Diagram - Shows object interactions arranged in
                    time sequence
                  </option>
                  <option value="activity">
                    Activity Diagram - Shows the workflow from one activity to
                    another
                  </option>
                  <option value="component">
                    Component Diagram - Shows components and dependencies
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                Select the type of diagram that best represents your project
                structure
              </p>
            </div>

            <div className="mb-6">
              <button
                onClick={toggleAdvancedOptions}
                className="flex items-center text-indigo-600 hover:text-indigo-800 py-2 px-3 rounded-md hover:bg-indigo-50 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 mr-2 transition-transform ${
                    showAdvancedOptions ? "rotate-90" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {showAdvancedOptions
                  ? "Hide Advanced Options"
                  : "Show Advanced Options"}
              </button>

              {showAdvancedOptions && (
                <div className="mt-4 p-5 bg-gray-50 rounded-md border border-gray-200">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      Focus Context (Optional)
                    </label>
                    <input
                      type="text"
                      value={focusContext}
                      onChange={(e) => setFocusContext(e.target.value)}
                      placeholder="e.g., authentication, payment processing"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1 ml-1">
                      Specify a particular subsystem or feature to focus on,
                      like "authentication flow" or "shopping cart"
                    </p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          Need more control? After generating the diagram, you
                          can:
                        </p>
                        <ul className="list-disc ml-5 mt-2 space-y-1 text-sm text-blue-700">
                          <li>Include/exclude specific classes</li>
                          <li>Add custom prompt instructions</li>
                          <li>Fine-tune the diagram's focus</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={generateDiagram}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-md text-white font-medium flex items-center justify-center gap-2 transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Analyzing Repository...</span>
                </>
              ) : (
                <>
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                  <span>Generate UML Diagram</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showEditor && (
        <Modal
          isOpen={showEditor}
          onClose={closeEditor}
          maxWidth="1200px"
          title="Edit Diagram - Create custom UML diagram"
        >
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {selectedDiagramType.charAt(0).toUpperCase() +
                selectedDiagramType.slice(1)}{" "}
              Diagram Editor
            </h2>
            <div className="h-[70vh]">
              <DiagramEditor
                initialDiagram={{
                  plantUmlCode: diagramResult?.plantUmlCode || "",
                  diagramUrl:
                    diagramResult?.diagramUrl || diagramResult?.url || "",
                }}
                owner={owner}
                repo={repo}
                token={token}
                diagramType={selectedDiagramType}
                onClose={closeEditor}
                onSave={handleEditorSave}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AiDiagramGenerator;
