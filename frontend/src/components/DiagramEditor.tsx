import React, { useState, useEffect } from "react";
import { umlService, DiagramType } from "../services/umlService";
import DiagramDisplay from "./DiagramDisplay";
import Modal from "./Modal";

interface DiagramEditorProps {
  initialDiagram?: {
    plantUmlCode: string;
    diagramUrl: string;
  };
  owner: string;
  repo: string;
  token: string;
  diagramType: DiagramType;
  onClose: () => void;
  onSave?: (updatedDiagram: {
    plantUmlCode: string;
    diagramUrl: string;
  }) => void;
}

interface ClassNode {
  name: string;
  selected: boolean;
  content: string;
  relationships: string[];
  package?: string;
}

const DiagramEditor: React.FC<DiagramEditorProps> = ({
  initialDiagram,
  owner,
  repo,
  token,
  diagramType,
  onClose,
  onSave,
}) => {
  console.log("DiagramEditor initialized with:", {
    initialDiagram,
    owner,
    repo,
    diagramType,
  });

  const [plantUmlCode, setPlantUmlCode] = useState(
    initialDiagram?.plantUmlCode || ""
  );
  const [diagramUrl, setDiagramUrl] = useState(
    initialDiagram?.diagramUrl || ""
  );
  const [promptInput, setPromptInput] = useState("");
  const [contextFocus, setContextFocus] = useState("");
  const [classes, setClasses] = useState<ClassNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract classes from PlantUML code when it's loaded or changed
  useEffect(() => {
    console.log("plantUmlCode changed:", plantUmlCode);
    if (plantUmlCode) {
      // Clean up the PlantUML code first
      const cleanedCode = cleanupPlantUmlCode(plantUmlCode);
      if (cleanedCode !== plantUmlCode) {
        setPlantUmlCode(cleanedCode);
        return; // Will trigger this useEffect again with cleaned code
      }

      const extractedClasses = extractClassesFromPlantUML(plantUmlCode);
      console.log("Extracted classes:", extractedClasses);
      setClasses(extractedClasses);
    }
  }, [plantUmlCode]);

  // Function to clean up PlantUML code with potential formatting issues
  const cleanupPlantUmlCode = (code: string): string => {
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

  // Parse PlantUML to extract classes and their relationships
  const extractClassesFromPlantUML = (code: string): ClassNode[] => {
    // If it's not a class diagram, return an empty array or a placeholder
    if (diagramType !== "class") {
      console.log(
        `Diagram type is ${diagramType}, editor is currently optimized for class diagrams`
      );

      // For non-class diagrams, we don't try to parse them for editing individual elements
      // Just return an empty array as we'll treat the whole diagram as one unit
      return [];
    }

    const classLines = code.split("\n");
    const classRegex = /class\s+(\w+)(\s+.*?)?\s*\{/;
    const relationshipRegex =
      /(\w+)\s+(--|>|--|<|-|>|<-|>|<\.|>|\.|<\|>|-\*|o-|<o-|->|\*-|-o)/;

    const extractedClasses: ClassNode[] = [];
    const relationships: Record<string, string[]> = {};

    // Track current package
    let currentPackage = "";
    let currentClass = "";
    let currentContent = "";
    let insideClass = false;

    // Extract classes and their contents
    for (let i = 0; i < classLines.length; i++) {
      const line = classLines[i].trim();

      // Track package context
      if (line.startsWith("package") && line.includes("{")) {
        currentPackage = line.replace("package", "").replace("{", "").trim();
        // Remove quotes if they exist
        currentPackage = currentPackage.replace(/"/g, "");
      } else if (line === "}") {
        if (insideClass) {
          // End of class
          currentContent += line + "\n";
          extractedClasses.push({
            name: currentClass,
            selected: true,
            content: currentContent,
            relationships: [],
            package: currentPackage, // Store the package information
          });
          insideClass = false;
          currentClass = "";
          currentContent = "";
        } else if (
          currentPackage &&
          !line.includes("class") &&
          !line.match(relationshipRegex)
        ) {
          // Potential end of package
          currentPackage = "";
        }
      }

      if (line.startsWith("class ") && line.includes("{")) {
        const match = line.match(classRegex);
        if (match) {
          if (insideClass) {
            // Save previous class
            extractedClasses.push({
              name: currentClass,
              selected: true,
              content: currentContent,
              relationships: [],
              package: currentPackage, // Store the package information
            });
          }

          currentClass = match[1];
          currentContent = line + "\n";
          insideClass = true;
        }
      } else if (insideClass && line === "}") {
        currentContent += line + "\n";
        extractedClasses.push({
          name: currentClass,
          selected: true,
          content: currentContent,
          relationships: [],
          package: currentPackage, // Store the package information
        });
        insideClass = false;
        currentClass = "";
        currentContent = "";
      } else if (insideClass) {
        currentContent += line + "\n";
      } else if (line.match(relationshipRegex)) {
        // Store relationships
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const from = parts[0];
          const to = parts[2];

          if (!relationships[from]) relationships[from] = [];
          relationships[from].push(line);

          if (!relationships[to]) relationships[to] = [];
          relationships[to].push(line);
        }
      }
    }

    // Add relationships to classes
    extractedClasses.forEach((cls) => {
      if (relationships[cls.name]) {
        cls.relationships = relationships[cls.name];
      }
    });

    return extractedClasses;
  };

  // Toggle selection of a class
  const toggleClassSelection = (className: string) => {
    setClasses((prevClasses) =>
      prevClasses.map((cls) =>
        cls.name === className ? { ...cls, selected: !cls.selected } : cls
      )
    );
  };

  // Generate updated PlantUML with only selected classes
  const generateUpdatedDiagram = async () => {
    try {
      setLoading(true);
      setError(null);

      // For non-class diagrams, we don't filter elements and instead use the entire diagram
      let selectedClassNames: string[] = [];
      if (diagramType === "class") {
        // Filter selected classes
        const selectedClasses = classes.filter((cls) => cls.selected);

        if (selectedClasses.length === 0 && classes.length > 0) {
          setError("Please select at least one class for the diagram");
          setLoading(false);
          return;
        }

        // Get selected class names
        selectedClassNames = selectedClasses.map((cls) => cls.name);
      }

      // Build a prompt with context focus
      let focusedPrompt = promptInput;
      if (contextFocus) {
        focusedPrompt = `Focus on ${contextFocus} functionality. ${promptInput}`;
      }

      // Generate the diagram with AI, focusing on selected classes and context
      const result = await umlService.generateAiUmlDiagramWithFocus({
        owner,
        repo,
        token,
        diagramType,
        focusContext: contextFocus,
        customPrompt: focusedPrompt,
        includedClasses: selectedClassNames,
      });

      setPlantUmlCode(result.plantUmlCode);
      setDiagramUrl(result.diagramUrl);
      setLoading(false);
    } catch (error: any) {
      console.error("Error updating diagram:", error);
      setError(error.response?.data?.error || "Failed to update diagram");
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const handleSave = () => {
    console.log("Saving diagram with:", { plantUmlCode, diagramUrl });
    if (onSave) {
      onSave({
        plantUmlCode,
        diagramUrl,
      });
    }
    onClose();
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Left sidebar - Class selection */}
      {diagramType === "class" && classes.length > 0 ? (
        <div
          className="w-full md:w-1/3 p-4 border-r overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Classes in Diagram
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Select the classes to include
            </p>

            <div className="flex justify-between mb-2">
              <button
                onClick={() =>
                  setClasses(classes.map((cls) => ({ ...cls, selected: true })))
                }
                className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Select All
              </button>
              <button
                onClick={() =>
                  setClasses(
                    classes.map((cls) => ({ ...cls, selected: false }))
                  )
                }
                className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Deselect All
              </button>
            </div>

            <div className="border rounded max-h-[150px] overflow-y-auto">
              {classes.length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No classes found in this diagram
                </div>
              ) : (
                <ul className="divide-y">
                  {classes.map((cls, index) => (
                    <li
                      key={`${cls.name}-${index}`}
                      className="p-2 hover:bg-gray-50"
                    >
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cls.selected}
                          onChange={() => toggleClassSelection(cls.name)}
                          className="mr-2 h-4 w-4 text-indigo-600 rounded"
                        />
                        <span className="font-mono text-sm">{cls.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Context Focus
            </h3>
            <input
              type="text"
              value={contextFocus}
              onChange={(e) => setContextFocus(e.target.value)}
              placeholder="e.g., authentication flow"
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Custom Instructions
            </h3>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Add instructions for the AI..."
              className="w-full p-2 border rounded h-20"
            />
          </div>

          <button
            onClick={generateUpdatedDiagram}
            disabled={loading}
            className={`w-full py-2 px-4 rounded ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? "Generating..." : "Update Diagram"}
          </button>
        </div>
      ) : (
        // For non-class diagrams, show a different sidebar
        <div
          className="w-full md:w-1/3 p-4 border-r overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {diagramType.charAt(0).toUpperCase() + diagramType.slice(1)}{" "}
              Diagram
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {diagramType === "sequence" &&
                "Edit the sequence diagram by providing focus context and custom prompts."}
              {diagramType === "activity" &&
                "Edit the activity diagram by providing focus context and custom prompts."}
              {diagramType === "component" &&
                "Edit the component diagram by providing focus context and custom prompts."}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Context Focus
            </h3>
            <input
              type="text"
              value={contextFocus}
              onChange={(e) => setContextFocus(e.target.value)}
              placeholder={
                diagramType === "sequence"
                  ? "e.g., login process"
                  : diagramType === "activity"
                  ? "e.g., checkout flow"
                  : "e.g., API components"
              }
              className="w-full p-2 border rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              {diagramType === "sequence" &&
                "Specify which interactions to focus on"}
              {diagramType === "activity" &&
                "Specify which workflow to focus on"}
              {diagramType === "component" &&
                "Specify which components to focus on"}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              Custom Instructions
            </h3>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={
                diagramType === "sequence"
                  ? "e.g., Show authentication flow between User, AuthService, and Database"
                  : diagramType === "activity"
                  ? "e.g., Include error handling in the checkout flow"
                  : "e.g., Focus on the data flow between frontend and backend components"
              }
              className="w-full p-2 border rounded h-20"
            />
          </div>

          <button
            onClick={generateUpdatedDiagram}
            disabled={loading}
            className={`w-full py-2 px-4 rounded ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? "Generating..." : "Update Diagram"}
          </button>
        </div>
      )}

      {/* Right side - PlantUML preview */}
      <div className="w-full md:w-2/3 flex flex-col p-4 overflow-hidden">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 mb-4 rounded border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end mb-2">
          <button
            onClick={handlePreview}
            className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Preview
          </button>
        </div>

        <div className="flex-1 overflow-auto" style={{ maxHeight: "40vh" }}>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto h-full">
            {plantUmlCode || "No diagram code available yet"}
          </pre>
        </div>

        <div className="pt-4 mt-auto flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!plantUmlCode}
            className={`px-4 py-2 rounded ${
              !plantUmlCode
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>

      {showPreview && diagramUrl && (
        <Modal
          isOpen={showPreview}
          onClose={closePreview}
          maxWidth="800px"
          title="Diagram Preview"
        >
          <div className="p-4">
            <img
              src={diagramUrl}
              alt="Diagram Preview"
              className="max-w-full mx-auto"
              style={{ maxHeight: "70vh" }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DiagramEditor;
