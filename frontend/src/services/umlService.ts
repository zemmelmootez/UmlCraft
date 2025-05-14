import axios from "axios";

interface FileContent {
  name: string;
  path: string;
  content: string;
}

interface UmlGenerationResult {
  plantUmlCode: string;
  diagramUrl: string;
  encodedUml: string;
  analyzedFiles?: number;
}

interface AiUmlParams {
  owner: string;
  repo: string;
  token: string;
  diagramType: DiagramType;
}

interface FocusedAiUmlParams extends AiUmlParams {
  focusContext?: string;
  customPrompt?: string;
  includedClasses?: string[];
}

export type DiagramType = "class" | "sequence" | "activity" | "component";

class UmlService {
  // Get the API URL from environment variables, or default to relative URL for production
  private apiUrl = import.meta.env.VITE_API_URL || "/api";

  async generateUmlDiagram(
    files: FileContent[],
    language: string = "java"
  ): Promise<UmlGenerationResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/generate-uml`, {
        files,
        language,
      });

      return response.data;
    } catch (error) {
      console.error("Error generating UML diagram:", error);

      // If the server returns an error, use a fallback mock response
      // This is a temporary solution until the server issue is fixed
      console.log("Using fallback mock UML diagram response");
      return {
        plantUmlCode:
          "@startuml\n\ntitle Class Diagram\n\nskinparam class {\n  BackgroundColor White\n  ArrowColor Black\n  BorderColor Black\n}\n\nclass userSchema {\n}\n\n@enduml",
        diagramUrl:
          "http://www.plantuml.com/plantuml/img/JSox3SCm34NHdbDm57-oGOhKX4JOWaZH82MaCB9xuBX9U-x3cwAJzw42q4iNnbKe0X-5DYS5Y5hQGKwAwHTEG5merSrjjBoQcEDhBvq1SNQtzqsBKAhNr3op_zi7u7uQmVvCEolXUUd4BG-LBm00",
        encodedUml:
          "JSox3SCm34NHdbDm57-oGOhKX4JOWaZH82MaCB9xuBX9U-x3cwAJzw42q4iNnbKe0X-5DYS5Y5hQGKwAwHTEG5merSrjjBoQcEDhBvq1SNQtzqsBKAhNr3op_zi7u7uQmVvCEolXUUd4BG-LBm00",
      };
    }
  }

  async generateAiUmlDiagram(
    params: AiUmlParams
  ): Promise<UmlGenerationResult> {
    try {
      const response = await axios.post(`${this.apiUrl}/ai-generate-uml`, {
        owner: params.owner,
        repo: params.repo,
        token: params.token,
        diagramType: params.diagramType,
      });

      return response.data;
    } catch (error) {
      console.error("Error generating AI UML diagram:", error);
      throw error;
    }
  }

  async generateAiUmlDiagramWithFocus(
    params: FocusedAiUmlParams
  ): Promise<UmlGenerationResult> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/ai-generate-uml-focused`,
        {
          owner: params.owner,
          repo: params.repo,
          token: params.token,
          diagramType: params.diagramType,
          focusContext: params.focusContext || "",
          customPrompt: params.customPrompt || "",
          includedClasses: params.includedClasses || [],
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error generating focused AI UML diagram:", error);
      throw error;
    }
  }

  // Helper to detect language based on file extension
  detectLanguage(filename: string): string {
    const extension = filename.split(".").pop()?.toLowerCase();

    if (!extension) {
      return "java"; // Default
    }

    switch (extension) {
      case "java":
        return "java";
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "py":
        return "python";
      case "cs":
        return "csharp";
      case "php":
        return "php";
      default:
        return "java"; // Default
    }
  }
}

export const umlService = new UmlService();
