const express = require("express");
const cors = require("cors");
const axios = require("axios");
const plantuml = require("plantuml-encoder");
const OpenAI = require("openai");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env file
const envPath = path.resolve(__dirname, ".env");
console.log(`Looking for .env file at: ${envPath}`);
const envExists = fs.existsSync(envPath);
console.log(`File exists: ${envExists}`);

// Load environment variables
dotenv.config({ path: envPath });

// Check for required environment variables
const requiredVars = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "OPENAI_API_KEY",
];
const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    "ERROR: Missing required environment variables:",
    missingVars.join(", ")
  );
  console.error(
    'Please run "node create-env.js" or "./create-env.ps1" to configure your environment'
  );
  process.exit(1);
}

// Log environment variable status
console.log("Environment Variables Status:");
console.log(
  `- GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? "Set" : "Not set"}`
);
console.log(
  `- GITHUB_CLIENT_SECRET: ${
    process.env.GITHUB_CLIENT_SECRET ? "Set" : "Not set"
  }`
);
console.log(
  `- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "Set" : "Not set"}`
);
console.log(`- PORT: ${process.env.PORT || "Using default (3001)"}`);

// GitHub OAuth credentials from environment variables
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Initialize OpenAI client with proper error handling
let openai;
try {
  // Fallback to a default key for development if env variable is missing
  const fallbackKey = "sk-xxxx"; // Invalid key that will cause OpenAI to error if actually used

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || fallbackKey,
  });

  console.log("OpenAI client initialized successfully");
} catch (error) {
  console.error("Error initializing OpenAI client:", error.message);
  // Continue execution - will handle API failures gracefully later
}

const app = express();
const PORT = process.env.PORT || 3001;

// Update the CORS configuration section
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          "https://uml-craft.vercel.app",
          "https://umlcraft.vercel.app",
          /\.vercel\.app$/,
          /localhost:\d+$/,
        ]
      : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Enable CORS with configuration
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Handler for GitHub OAuth redirect in serverless environments
app.get("/auth/github", (req, res) => {
  // In serverless, this shouldn't be hit directly but is for safety
  const clientId = GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? `${req.protocol}://${req.headers.host}/auth/github/callback`
      : "http://localhost:5173/auth/github/callback";

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo,user`;

  // Redirect to GitHub OAuth flow
  res.redirect(githubAuthUrl);
});

// GitHub OAuth token exchange endpoint
app.post("/api/github/token", async (req, res) => {
  try {
    const { code } = req.body;

    console.log("Token exchange request received");
    console.log("Headers:", JSON.stringify(req.headers));
    console.log("Body:", JSON.stringify(req.body));

    if (!code) {
      console.error("No authorization code provided in request");
      return res.status(400).json({ error: "Authorization code is required" });
    }

    console.log("Using GitHub credentials:");
    console.log("- Client ID:", GITHUB_CLIENT_ID);
    console.log("- Client Secret exists:", !!GITHUB_CLIENT_SECRET);

    console.log(
      `Exchanging code for token with: Client ID: ${GITHUB_CLIENT_ID.substring(
        0,
        5
      )}..., Code: ${code.substring(0, 5)}...`
    );

    // Exchange the code for an access token
    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("GitHub API response received");

      if (response.data.error) {
        console.error("GitHub API error:", response.data);
        return res.status(400).json({
          error: response.data.error_description,
          details: response.data,
        });
      }

      // Return the token to the client
      console.log("Successfully exchanged code for token");
      res.json({ access_token: response.data.access_token });
    } catch (githubError) {
      console.error("GitHub API request failed:", githubError.message);
      console.error("Full error:", githubError);

      if (githubError.response) {
        console.error("GitHub response data:", githubError.response.data);
        console.error("GitHub response status:", githubError.response.status);
      }

      return res.status(500).json({
        error: "GitHub API request failed",
        details: githubError.message,
        response: githubError.response?.data || "No response data",
      });
    }
  } catch (error) {
    console.error("Token exchange error:", error.message);
    console.error("Full error:", error);
    res.status(500).json({
      error: "Failed to exchange code for token",
      details: error.message,
    });
  }
});

// Simple health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate UML diagram from code
app.post("/api/generate-uml", async (req, res) => {
  try {
    const { files, language } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Files are required" });
    }

    console.log(`Generating UML diagram for ${files.length} files`);

    // Generate PlantUML code
    const plantUmlCode = generatePlantUmlFromFiles(files, language);

    // Encode the PlantUML code to get the URL
    const encodedUml = plantuml.encode(plantUmlCode);

    // Generate the URL for PlantUML server
    const plantUmlUrl = `http://www.plantuml.com/plantuml/img/${encodedUml}`;

    // Return both the PlantUML code and the URL
    res.json({
      plantUmlCode,
      diagramUrl: plantUmlUrl,
      encodedUml,
    });
  } catch (error) {
    console.error("UML generation error:", error.message);
    res.status(500).json({ error: "Failed to generate UML diagram" });
  }
});

// New endpoint to analyze repository and generate AI-based UML diagrams
app.post("/api/ai-generate-uml", async (req, res) => {
  try {
    console.log("Received request to /api/ai-generate-uml");
    const { owner, repo, token, diagramType = "class" } = req.body;

    console.log(
      `Request params: owner=${owner}, repo=${repo}, diagramType=${diagramType}`
    );
    console.log(`Token exists: ${!!token}`);

    if (!owner || !repo || !token) {
      return res.status(400).json({
        error: "Repository owner, name, and GitHub token are required",
      });
    }

    // Check OpenAI API key early
    if (!process.env.OPENAI_API_KEY) {
      console.error("API request received but OpenAI API key is missing");
      return res.status(503).json({
        error: "OpenAI API key is missing in server configuration",
        details: "Please configure OPENAI_API_KEY in the server's .env file",
        isConfigurationError: true,
      });
    }

    console.log(`Analyzing repository: ${owner}/${repo}`);

    try {
      // Get repository file structure
      console.log("Getting repository files...");
      const repoFiles = await getRepositoryFiles(owner, repo, token);
      console.log(`Found ${repoFiles.length} total files`);

      // Filter code files and exclude non-code files
      console.log("Filtering code files...");
      const codeFiles = filterCodeFiles(repoFiles);
      console.log(`Found ${codeFiles.length} code files after filtering`);

      if (codeFiles.length === 0) {
        return res.status(400).json({
          error: "No suitable code files found in the repository",
        });
      }

      // Get content of code files
      console.log("Getting file contents...");
      const filesWithContent = await getFilesContent(
        owner,
        repo,
        token,
        codeFiles
      );
      console.log(`Retrieved content for ${filesWithContent.length} files`);

      // Generate UML diagram using AI
      console.log("Generating AI UML diagram...");
      const aiGeneratedUml = await generateAiUmlDiagram(
        filesWithContent,
        diagramType
      );
      console.log("UML diagram generated successfully");

      // Encode the PlantUML code to get the URL
      console.log("Encoding PlantUML code...");
      const encodedUml = plantuml.encode(aiGeneratedUml);

      // Generate the URL for PlantUML server
      const plantUmlUrl = `http://www.plantuml.com/plantuml/img/${encodedUml}`;

      // Return both the PlantUML code and the URL
      console.log("Sending response...");
      res.json({
        plantUmlCode: aiGeneratedUml,
        diagramUrl: plantUmlUrl,
        encodedUml,
        analyzedFiles: codeFiles.length,
      });
    } catch (innerError) {
      console.error("Inner error details:", innerError);
      throw innerError;
    }
  } catch (error) {
    console.error("AI UML generation error:", error.message);
    console.error("Full error:", error);

    // Check if it's an OpenAI-related error
    const isOpenAiError =
      error.message &&
      (error.message.includes("OpenAI") || error.message.includes("API key"));

    res.status(isOpenAiError ? 503 : 500).json({
      error: "Failed to generate AI UML diagram",
      details: error.message,
      isConfigurationError: isOpenAiError,
    });
  }
});

// New endpoint for focused AI-based UML diagrams
app.post("/api/ai-generate-uml-focused", async (req, res) => {
  try {
    console.log("Received request to /api/ai-generate-uml-focused");
    const {
      owner,
      repo,
      token,
      diagramType = "class",
      focusContext = "",
      customPrompt = "",
      includedClasses = [],
    } = req.body;

    console.log(
      `Request params: owner=${owner}, repo=${repo}, diagramType=${diagramType}`
    );
    console.log(`Focus context: ${focusContext}`);
    console.log(
      `Custom prompt: ${customPrompt.substring(0, 50)}${
        customPrompt.length > 50 ? "..." : ""
      }`
    );
    console.log(`Included classes: ${includedClasses.length}`);

    if (!owner || !repo || !token) {
      return res.status(400).json({
        error: "Repository owner, name, and GitHub token are required",
      });
    }

    // Check OpenAI API key early
    if (!process.env.OPENAI_API_KEY) {
      console.error("API request received but OpenAI API key is missing");
      return res.status(503).json({
        error: "OpenAI API key is missing in server configuration",
        details: "Please configure OPENAI_API_KEY in the server's .env file",
        isConfigurationError: true,
      });
    }

    console.log(`Analyzing repository with focus: ${owner}/${repo}`);

    try {
      // Get repository file structure
      console.log("Getting repository files...");
      const repoFiles = await getRepositoryFiles(owner, repo, token);
      console.log(`Found ${repoFiles.length} total files`);

      // Filter code files and exclude non-code files
      console.log("Filtering code files...");
      const codeFiles = filterCodeFiles(repoFiles);
      console.log(`Found ${codeFiles.length} code files after filtering`);

      if (codeFiles.length === 0) {
        return res.status(400).json({
          error: "No suitable code files found in the repository",
        });
      }

      // Get content of code files
      console.log("Getting file contents...");
      const filesWithContent = await getFilesContent(
        owner,
        repo,
        token,
        codeFiles
      );
      console.log(`Retrieved content for ${filesWithContent.length} files`);

      // Generate UML diagram using AI with focus
      console.log("Generating focused AI UML diagram...");
      const aiGeneratedUml = await generateFocusedAiUmlDiagram(
        filesWithContent,
        diagramType,
        focusContext,
        customPrompt,
        includedClasses
      );
      console.log("Focused UML diagram generated successfully");

      // Encode the PlantUML code to get the URL
      console.log("Encoding PlantUML code...");
      const encodedUml = plantuml.encode(aiGeneratedUml);

      // Generate the URL for PlantUML server
      const plantUmlUrl = `http://www.plantuml.com/plantuml/img/${encodedUml}`;

      // Return both the PlantUML code and the URL
      console.log("Sending response...");
      res.json({
        plantUmlCode: aiGeneratedUml,
        diagramUrl: plantUmlUrl,
        encodedUml,
        analyzedFiles: filesWithContent.length,
      });
    } catch (innerError) {
      console.error("Inner error details:", innerError);
      throw innerError;
    }
  } catch (error) {
    console.error("Focused AI UML generation error:", error.message);
    console.error("Full error:", error);

    // Check if it's an OpenAI-related error
    const isOpenAiError =
      error.message &&
      (error.message.includes("OpenAI") || error.message.includes("API key"));

    res.status(isOpenAiError ? 503 : 500).json({
      error: "Failed to generate focused AI UML diagram",
      details: error.message,
      isConfigurationError: isOpenAiError,
    });
  }
});

// Get repository file structure
async function getRepositoryFiles(owner, repo, token, path = "") {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    let allFiles = [];

    for (const item of response.data) {
      if (item.type === "file") {
        allFiles.push({
          name: item.name,
          path: item.path,
          type: "file",
          size: item.size,
          download_url: item.download_url,
        });
      } else if (item.type === "dir") {
        // Recursively get files from subdirectories
        const subFiles = await getRepositoryFiles(
          owner,
          repo,
          token,
          item.path
        );
        allFiles = allFiles.concat(subFiles);
      }
    }

    return allFiles;
  } catch (error) {
    console.error(`Error getting repository files: ${error.message}`);
    throw error;
  }
}

// Filter code files and exclude non-code files like node_modules, etc.
function filterCodeFiles(files) {
  const codeExtensions = [
    ".java",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".py",
    ".cs",
    ".php",
    ".rb",
    ".go",
    ".swift",
    ".kt",
    ".cpp",
    ".c",
    ".h",
  ];

  const excludePatterns = [
    /node_modules/,
    /\.git/,
    /\.vscode/,
    /\.idea/,
    /dist\//,
    /build\//,
    /\.env/,
    /package-lock\.json/,
    /yarn\.lock/,
    /test/,
    /\.md$/,
    /\.json$/,
    /\.css$/,
    /\.scss$/,
    /\.html$/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
  ];

  return files.filter((file) => {
    // Check if file has a code extension
    const hasCodeExtension = codeExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    // Check if file should be excluded
    const shouldExclude = excludePatterns.some((pattern) =>
      pattern.test(file.path)
    );

    return hasCodeExtension && !shouldExclude;
  });
}

// Get content of code files
async function getFilesContent(owner, repo, token, files) {
  const filesWithContent = [];

  // Limit the number of files to analyze more aggressively (was 30)
  const filesToAnalyze = files.slice(0, 15);

  for (const file of filesToAnalyze) {
    try {
      // Skip very large files that might contribute to context length issues
      if (file.size > 100000) {
        // Skip files larger than ~100KB
        console.log(`Skipping large file ${file.path} (${file.size} bytes)`);
        continue;
      }

      // Get file content
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      // GitHub API returns content as base64 encoded
      const content = Buffer.from(response.data.content, "base64").toString();

      filesWithContent.push({
        name: file.name,
        path: file.path,
        content,
        size: file.size,
      });
    } catch (error) {
      console.error(`Error getting content for ${file.path}: ${error.message}`);
      // Continue with other files even if one fails
    }
  }

  return filesWithContent;
}

// Generate UML diagram using AI
async function generateAiUmlDiagram(files, diagramType) {
  try {
    console.log(`Starting AI diagram generation for type: ${diagramType}`);
    console.log(`Processing ${files.length} files`);

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("No OpenAI API key found in environment variables");
      return `@startuml
title AI UML Generation Error
note "OpenAI API key is missing in .env file" as N1
note "Please configure your OPENAI_API_KEY" as N2
@enduml`;
    }

    console.log(
      `Using OpenAI API key: ${
        process.env.OPENAI_API_KEY
          ? process.env.OPENAI_API_KEY.substring(0, 10) + "..."
          : "Not found"
      }`
    );

    // Try with normal settings first
    try {
      return await generateUmlWithContext(
        files,
        diagramType,
        10, // maxFiles
        800 // contentLength
      );
    } catch (error) {
      // If we hit token limit exception, try with more aggressive limits
      if (
        error.message.includes("maximum context length") ||
        (error.code && error.code === "context_length_exceeded")
      ) {
        console.log("Context length exceeded, trying with reduced context...");
        return await generateUmlWithContext(
          files,
          diagramType,
          5, // maxFiles - reduced
          400 // contentLength - reduced
        );
      }
      // If it's not a context length error, rethrow
      throw error;
    }
  } catch (error) {
    console.error(`Error generating AI UML diagram: ${error.message}`);
    console.error("Full error:", error);

    // Return a PlantUML error diagram
    return `@startuml
title UML Generation Error
note "Error: ${error.message}" as N1
@enduml`;
  }
}

// Helper function that actually generates the UML with configurable context limits
async function generateUmlWithContext(
  files,
  diagramType,
  maxFiles,
  contentLength
) {
  // Prepare the context for OpenAI
  let contextText =
    "Analyze these code files and create a PlantUML diagram:\n\n";

  // Prioritize files to reduce context size
  const relevantFiles = prioritizeFiles(files, "", []);

  // Limit to specified number of files to reduce context size
  const filesToInclude = relevantFiles.slice(
    0,
    Math.min(maxFiles, relevantFiles.length)
  );

  // Add file contents to context
  for (const file of filesToInclude) {
    // More aggressive truncation to reduce context size
    const maxContentLength = contentLength;

    const truncatedContent =
      file.content.substring(0, maxContentLength) +
      (file.content.length > maxContentLength
        ? "\n... (content truncated)"
        : "");

    contextText += `--- ${file.path} ---\n${truncatedContent}\n\n`;
  }

  // Instructions based on diagram type
  let instructions = "";
  if (diagramType === "class") {
    instructions =
      "Create a concise class diagram showing only essential classes, attributes, methods, and relationships. Focus on clarity over completeness.";
  } else if (diagramType === "sequence") {
    instructions =
      "Create a sequence diagram showing key interactions between components. Be concise and focus on main flow. Use proper PlantUML sequence diagram syntax with participants and message arrows. DO NOT create a class diagram.";
  } else if (diagramType === "activity") {
    instructions =
      "Create a simplified activity diagram showing the main application flow.";
  } else if (diagramType === "component") {
    instructions =
      "Create a component diagram showing major components and dependencies only.";
  }

  console.log("Sending request to OpenAI...");
  // Call OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert software architect who specializes in creating concise UML diagrams. 
Focus only on the most essential elements and relationships. Return ONLY valid last version of PlantUML code without any explanations.
You are generating a ${diagramType} diagram. Pay special attention to the diagram type syntax:
- For class diagrams: Use class definitions with attributes and methods, and relationship arrows
- For sequence diagrams: Use actor/participant definitions and arrows with messages between them showing time-ordered interactions
- For activity diagrams: Use start/stop nodes, activities, decisions, and transitions
- For component diagrams: Use components, interfaces, and dependencies

Remember to use the specific PlantUML syntax required for ${diagramType} diagrams.`,
      },
      {
        role: "user",
        content: `${contextText}\n\n${instructions}\n\nCreate a minimal but accurate PlantUML ${diagramType} diagram. Respond with valid PlantUML code only`,
      },
    ],
    temperature: 0.2,
    max_tokens: 4000,
  });

  console.log("Received response from OpenAI");

  // Extract PlantUML code from response
  let plantUmlCode = response.choices[0].message.content.trim();

  // Clean up the PlantUML code
  plantUmlCode = sanitizePlantUmlCode(plantUmlCode);

  console.log("PlantUML code generated successfully");
  return plantUmlCode;
}

// Helper function to clean up PlantUML code
function sanitizePlantUmlCode(code) {
  // Remove code fences if present (```plantuml or ```)
  code = code.replace(/^```(?:plantuml)?\n/gm, "");
  code = code.replace(/```$/gm, "");

  // Strip any extra @startuml/@enduml tags in the middle
  code = code.replace(/@enduml\s*@startuml/g, "\n");

  // Ensure there's exactly one @startuml at the beginning
  code = code.replace(/@startuml/g, "");
  code = "@startuml\n" + code;

  // Ensure there's exactly one @enduml at the end
  code = code.replace(/@enduml/g, "");
  code = code.trim() + "\n@enduml";

  return code;
}

// Generate UML diagram using AI with focus on specific context or classes
async function generateFocusedAiUmlDiagram(
  files,
  diagramType,
  focusContext,
  customPrompt,
  includedClasses
) {
  try {
    console.log(
      `Starting focused AI diagram generation for type: ${diagramType}`
    );
    console.log(`Focus context: ${focusContext}`);
    console.log(
      `With ${files.length} files and ${includedClasses.length} specified classes`
    );

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("No OpenAI API key found in environment variables");
      return `@startuml
title AI UML Generation Error
note "OpenAI API key is missing in .env file" as N1
note "Please configure your OPENAI_API_KEY" as N2
@enduml`;
    }

    // Try with normal settings first
    try {
      return await generateFocusedUmlWithContext(
        files,
        diagramType,
        focusContext,
        customPrompt,
        includedClasses,
        10, // maxFiles
        { high: 1500, low: 500 } // contentLengths
      );
    } catch (error) {
      // If we hit token limit exception, try with more aggressive limits
      if (
        error.message.includes("maximum context length") ||
        (error.code && error.code === "context_length_exceeded")
      ) {
        console.log("Context length exceeded, trying with reduced context...");
        return await generateFocusedUmlWithContext(
          files,
          diagramType,
          focusContext,
          customPrompt,
          includedClasses,
          5, // maxFiles - reduced
          { high: 800, low: 300 } // contentLengths - reduced
        );
      }
      // If it's not a context length error, rethrow
      throw error;
    }
  } catch (error) {
    console.error(`Error generating focused AI UML diagram: ${error.message}`);
    console.error("Full error:", error);

    // Return a PlantUML error diagram instead of throwing
    return `@startuml
title UML Generation Error
note "Error: ${error.message}" as N1
@enduml`;
  }
}

// Helper function that actually generates the UML with configurable context limits
async function generateFocusedUmlWithContext(
  files,
  diagramType,
  focusContext,
  customPrompt,
  includedClasses,
  maxFiles,
  contentLengths
) {
  // Prepare the context for OpenAI with focus information
  let contextText = "Analyze these code files and create a PlantUML diagram";

  if (focusContext) {
    contextText += ` focusing specifically on the ${focusContext} functionality`;
  }

  contextText += ":\n\n";

  // Calculate relevance scores for files if we have a focus context or included classes
  const relevantFiles = prioritizeFiles(files, focusContext, includedClasses);

  // Take only most relevant files to reduce context size
  const filesToInclude = relevantFiles.slice(
    0,
    Math.min(maxFiles, relevantFiles.length)
  );

  // Add file contents to context - with more aggressive truncation
  for (const file of filesToInclude) {
    // More aggressive truncation to reduce context size
    const maxContentLength =
      file.relevanceScore > 0.7 ? contentLengths.high : contentLengths.low;

    const truncatedContent =
      file.content.substring(0, maxContentLength) +
      (file.content.length > maxContentLength
        ? "\n... (content truncated)"
        : "");

    contextText += `--- ${file.path} ---\n${truncatedContent}\n\n`;
  }

  // Add specific class information if provided
  if (includedClasses && includedClasses.length > 0) {
    contextText += `\nIMPORTANT: Include ONLY these classes in the diagram: ${includedClasses.join(
      ", "
    )}\n\n`;
  }

  // Instructions based on diagram type and focus
  let instructions = "";
  if (diagramType === "class") {
    instructions =
      "Create a concise class diagram showing only essential classes, attributes, methods, and relationships. Focus on clarity over completeness.";
  } else if (diagramType === "sequence") {
    instructions =
      "Create a sequence diagram showing key interactions between components. Be concise and focus on main flow. Use proper PlantUML sequence diagram syntax with participants and message arrows. DO NOT create a class diagram.";
  } else if (diagramType === "activity") {
    instructions =
      "Create a simplified activity diagram showing the main application flow.";
  } else if (diagramType === "component") {
    instructions =
      "Create a component diagram showing major components and dependencies only.";
  }

  // Add custom prompt if provided
  if (customPrompt) {
    instructions += ` Additional instructions: ${customPrompt}`;
  }

  console.log("Sending focused request to OpenAI...");
  // Call OpenAI API with focused context
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an expert software architect who specializes in creating concise UML diagrams. 
Focus only on the most essential elements and relationships. Return ONLY valid last version of PlantUML code without any explanations.
You are generating a ${diagramType} diagram. Pay special attention to the diagram type syntax:
- For class diagrams: Use class definitions with attributes and methods, and relationship arrows
- For sequence diagrams: Use actor/participant definitions and arrows with messages between them showing time-ordered interactions
- For activity diagrams: Use start/stop nodes, activities, decisions, and transitions
- For component diagrams: Use components, interfaces, and dependencies

Remember to use the specific PlantUML syntax required for ${diagramType} diagrams.`,
      },
      {
        role: "user",
        content: `${contextText}\n\n${instructions}\n\nCreate a minimal but accurate PlantUML ${diagramType} diagram. Respond with valid PlantUML code only`,
      },
    ],
    temperature: 0.2,
    max_tokens: 4000,
  });

  console.log("Received focused response from OpenAI");

  // Extract PlantUML code from response
  let plantUmlCode = response.choices[0].message.content.trim();

  // Clean up the PlantUML code
  plantUmlCode = sanitizePlantUmlCode(plantUmlCode);

  console.log("Focused PlantUML code generated successfully");
  return plantUmlCode;
}

// New helper function to score and prioritize files based on relevance to focus
function prioritizeFiles(files, focusContext, includedClasses) {
  // If no focus or classes, return files as is with minimal scoring
  if (
    (!focusContext || focusContext === "") &&
    (!includedClasses || includedClasses.length === 0)
  ) {
    return files.map((file) => ({ ...file, relevanceScore: 0.5 }));
  }

  return files
    .map((file) => {
      let score = 0;
      const lowerContent = file.content.toLowerCase();
      const lowerPath = file.path.toLowerCase();

      // Score based on focus context
      if (focusContext && focusContext !== "") {
        const focusTerms = focusContext.toLowerCase().split(/\s+/);
        focusTerms.forEach((term) => {
          if (term.length > 3) {
            // Only consider meaningful terms
            if (lowerPath.includes(term)) score += 0.4;

            // Count occurrences in content for higher relevance
            const regex = new RegExp(term, "gi");
            const matches = lowerContent.match(regex);
            if (matches) {
              score += Math.min(0.3, matches.length * 0.03); // Cap at 0.3
            }
          }
        });
      }

      // Score based on included classes
      if (includedClasses && includedClasses.length > 0) {
        includedClasses.forEach((className) => {
          const classRegex = new RegExp(
            `(class|interface)\\s+${className}\\b`,
            "i"
          );
          if (classRegex.test(lowerContent)) {
            score += 0.7; // High score for files containing included classes
          }

          // Check for imports or usages of the class
          const usageRegex = new RegExp(`\\b${className}\\b`, "i");
          if (usageRegex.test(lowerContent)) {
            score += 0.3;
          }
        });
      }

      // Normalize score between 0 and 1
      score = Math.min(1.0, score);

      return {
        ...file,
        relevanceScore: score,
      };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore); // Sort by descending score
}

// Function to generate PlantUML code from files
function generatePlantUmlFromFiles(files, language = "java") {
  let plantUmlCode = "@startuml\n\n";

  // Add title
  plantUmlCode += `title Class Diagram\n\n`;

  // Skinparam for styling
  plantUmlCode += `skinparam class {\n`;
  plantUmlCode += `  BackgroundColor White\n`;
  plantUmlCode += `  ArrowColor Black\n`;
  plantUmlCode += `  BorderColor Black\n`;
  plantUmlCode += `}\n\n`;

  // Process each file
  const classes = new Map();
  const relationships = [];

  for (const file of files) {
    const { name, content, path } = file;

    if (!content) {
      console.log(`Empty content for file: ${name}`);
      continue;
    }

    try {
      // Parse the file content based on language
      if (
        language === "java" ||
        language === "typescript" ||
        language === "javascript"
      ) {
        const { classInfo, fileRelationships } = parseJavaOrTypeScriptFile(
          name,
          content
        );
        if (classInfo) {
          classes.set(classInfo.name, classInfo);
        }
        relationships.push(...fileRelationships);
      } else {
        console.log(`Unsupported language: ${language}`);
      }
    } catch (error) {
      console.error(`Error parsing file ${name}:`, error.message);
    }
  }

  // Add classes to PlantUML
  for (const classInfo of classes.values()) {
    plantUmlCode += `class ${classInfo.name} {\n`;

    // Add fields
    for (const field of classInfo.fields) {
      plantUmlCode += `  ${field.visibility} ${field.name}: ${field.type}\n`;
    }

    // Add methods
    for (const method of classInfo.methods) {
      plantUmlCode += `  ${method.visibility} ${method.name}(${method.params}): ${method.returnType}\n`;
    }

    plantUmlCode += `}\n\n`;
  }

  // Add relationships
  for (const relation of relationships) {
    plantUmlCode += `${relation.from} ${relation.type} ${relation.to}\n`;
  }

  plantUmlCode += "@enduml";
  return plantUmlCode;
}

// Parse Java or TypeScript file to extract classes, methods, etc.
function parseJavaOrTypeScriptFile(fileName, content) {
  const classInfo = {
    name: "",
    fields: [],
    methods: [],
  };

  const relationships = [];

  // Try to extract class name from file name
  const className = fileName.replace(/\.(java|ts|js)$/, "");
  classInfo.name = className;

  // Simple regex to find field declarations
  const fieldRegex = /(private|public|protected)?\s+(\w+)\s+(\w+)\s*;/g;
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    const visibility = match[1] || "package";
    const type = match[2];
    const name = match[3];

    classInfo.fields.push({ visibility, type, name });

    // Check for potential relationship
    if (
      ![
        "String",
        "int",
        "boolean",
        "float",
        "double",
        "void",
        "byte",
        "short",
        "long",
        "char",
      ].includes(type)
    ) {
      relationships.push({
        from: className,
        to: type,
        type: "-->",
      });
    }
  }

  // Simple regex to find method declarations
  const methodRegex =
    /(private|public|protected)?\s+(\w+)\s+(\w+)\s*\((.*?)\)\s*{/g;

  while ((match = methodRegex.exec(content)) !== null) {
    const visibility = match[1] || "package";
    const returnType = match[2];
    const name = match[3];
    const params = match[4].trim();

    classInfo.methods.push({ visibility, returnType, name, params });
  }

  // Look for inheritance
  const extendsRegex = /class\s+(\w+)\s+extends\s+(\w+)/;
  const extendsMatch = extendsRegex.exec(content);

  if (extendsMatch) {
    relationships.push({
      from: extendsMatch[1],
      to: extendsMatch[2],
      type: "--|>",
    });
  }

  // Look for interfaces
  const implementsRegex =
    /class\s+(\w+)(?:\s+extends\s+\w+)?\s+implements\s+([\w,\s]+)/;
  const implementsMatch = implementsRegex.exec(content);

  if (implementsMatch) {
    const interfaces = implementsMatch[2].split(",").map((i) => i.trim());

    for (const iface of interfaces) {
      relationships.push({
        from: implementsMatch[1],
        to: iface,
        type: "..|>",
      });
    }
  }

  return { classInfo, fileRelationships: relationships };
}

// Start the server
if (process.env.NODE_ENV !== "production") {
  // Only listen on a port in development mode
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  // In production (Vercel), we don't need to call listen() as it's handled by the platform
  console.log("Server running in production mode");
}

// For Vercel serverless deployment, export the app
module.exports = app;
