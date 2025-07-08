import { assertEquals, assertExists } from "@std/assert";
import { checkMermaidFile, checkMermaidFilesInDirectory } from "./main.ts";

Deno.test("checkMermaidFile - valid flowchart content", async () => {
  const validContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
END["/Thank you for using our service/"]

%% Connections
START == "User action" ==> END
\`\`\``;
  
  const result = checkMermaidFile(validContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - rectangle node with text and buttons", async () => {
  const rectangleContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
GREETING["/Hello {$user}! How can I help you?/ [Continue] [[Reply]]"]
END["/Thank you for using our service/"]

%% Connections
START == "User starts" ==> GREETING
GREETING == "[Continue]" ==> END
\`\`\``;
  
  const result = checkMermaidFile(rectangleContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - rectangle node with media only", async () => {
  const mediaContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
PHOTO["//photo of me// [View]"]
END["/Thank you for using our service/"]

%% Connections
START == "User starts" ==> PHOTO
PHOTO == "[View]" ==> END
\`\`\``;
  
  const result = checkMermaidFile(mediaContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - rectangle node with text and media", async () => {
  const textMediaContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
CONTENT["/Here's a photo of me/ //photo of me// [View]"]
END["/Thank you for using our service/"]

%% Connections
START == "User starts" ==> CONTENT
CONTENT == "[View]" ==> END
\`\`\``;
  
  const result = checkMermaidFile(textMediaContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - invalid rectangle node (no text or media)", async () => {
  const invalidContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
INVALID["This has no text or media blocks"]
END["/Thank you for using our service/"]

%% Connections
START == "User starts" ==> INVALID
INVALID == "User clicks" ==> END
\`\`\``;
  
  const result = checkMermaidFile(invalidContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("must contain at least text")), true);
});

Deno.test("checkMermaidFile - multi-line node definitions", async () => {
  const multiLineContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome to our
service/")
MESSAGE["/This is a multi-line
message/"]

%% Connections
START == "User begins" ==> MESSAGE
\`\`\``;
  
  const result = checkMermaidFile(multiLineContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - variables and templates", async () => {
  const variablesContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
GREETING["/Hello {$user_name}! How can I help you?/"]
PROCESS["/Processing with {template_name}/"]

%% Connections
START == "User starts" ==> GREETING
GREETING == "User responds" ==> PROCESS
\`\`\``;
  
  const result = checkMermaidFile(variablesContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - reply buttons", async () => {
  const replyButtonsContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
GREETING["/Hello! How can I help you?/"]
CHOICE{{"What would you like to do?"}}

%% Connections
START == "User starts" ==> GREETING
GREETING == "User responds" ==> CHOICE
CHOICE == "[Continue]" ==> START
\`\`\``;
  
  const result = checkMermaidFile(replyButtonsContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - missing text/media blocks", async () => {
  const missingTextContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
GREETING["Hello! How can I help you?"]

%% Connections
START == "User starts" ==> GREETING
\`\`\``;
  
  const result = checkMermaidFile(missingTextContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Rectangle node must contain at least text")), true);
});

Deno.test("checkMermaidFile - mixed button types", async () => {
  const mixedButtonsContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
GREETING["/Hello! How can I help you?/"]
CHOICE{{"What would you like to do?"}}

%% Connections
START == "User starts" ==> GREETING
GREETING == "User responds" ==> CHOICE
CHOICE == "[Continue] [[Reply]]" ==> START
\`\`\``;
  
  const result = checkMermaidFile(mixedButtonsContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Invalid comment format")), true);
});

Deno.test("checkMermaidFile - unterminated multi-line node", async () => {
  const unterminatedContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome to our
service
MESSAGE["/This message is missing closing bracket"]

%% Connections
START == "User begins" ==> MESSAGE
\`\`\``;
  
  const result = checkMermaidFile(unterminatedContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Unterminated multi-line node definition")), true);
});

Deno.test("checkMermaidFile - invalid flowchart content", async () => {
  const invalidContent = `# Test
\`\`\`mermaid
flowchart TD
START("/Welcome/")
END["/Thank you/"]
START --> END
\`\`\``;
  
  const result = checkMermaidFile(invalidContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.length > 0, true);
});

Deno.test("checkMermaidFile - missing sections", async () => {
  const missingSectionsContent = `# Test
\`\`\`mermaid
flowchart TD
START("/Welcome/")
END["/Thank you/"]
START == "Action" ==> END
\`\`\``;
  
  const result = checkMermaidFile(missingSectionsContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Missing")), true);
});

Deno.test("checkMermaidFile - wrong section order", async () => {
  const wrongOrderContent = `# Test
\`\`\`mermaid
flowchart TD
%% Connections
START("/Welcome/") == "Action" ==> END["/Thank you/"]

%% Node Definitions
START("/Welcome/")
END["/Thank you/"]
\`\`\``;
  
  const result = checkMermaidFile(wrongOrderContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("must come after")), true);
});

Deno.test("checkMermaidFile - undefined nodes", async () => {
  const undefinedNodesContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")

%% Connections
START == "Action" ==> UNDEFINED
\`\`\``;
  
  const result = checkMermaidFile(undefinedNodesContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("undefined node")), true);
});

Deno.test("checkMermaidFile - invalid node syntax", async () => {
  const invalidNodeContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START[Welcome]
END["/Thank you/"]

%% Connections
START == "Action" ==> END
\`\`\``;
  
  const result = checkMermaidFile(invalidNodeContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Invalid node definition")), true);
});

Deno.test("checkMermaidFile - invalid connection syntax", async () => {
  const invalidConnectionContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
END["/Thank you/"]

%% Connections
START --> END
\`\`\``;
  
  const result = checkMermaidFile(invalidConnectionContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Invalid connection syntax")), true);
});

Deno.test("checkMermaidFile - non-flowchart diagram", async () => {
  const nonFlowchartContent = `# Test
\`\`\`mermaid
sequenceDiagram
participant A
participant B
A->>B: Hello
\`\`\``;
  
  const result = checkMermaidFile(nonFlowchartContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Only flowcharts are validated")), true);
});

Deno.test("checkMermaidFile - empty mermaid block", async () => {
  const emptyContent = `# Test
\`\`\`mermaid

\`\`\``;
  
  const result = checkMermaidFile(emptyContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("empty")), true);
});

Deno.test("checkMermaidFile - no mermaid blocks", async () => {
  const noMermaidContent = `# Test
This is just regular markdown content.
No mermaid blocks here.`;
  
  const result = checkMermaidFile(noMermaidContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("No mermaid code blocks found")), true);
});

Deno.test("checkMermaidFilesInDirectory - correct folder", async () => {
  const results = await checkMermaidFilesInDirectory("tests/correct");
  
  assertExists(results);
  assertEquals(results.length > 0, true);
  
  // All files in correct folder should be valid
  results.forEach(result => {
    assertEquals(result.isValid, true, `File ${result.filePath} should be valid`);
  });
});

Deno.test("checkMermaidFilesInDirectory - incorrect folder", async () => {
  const results = await checkMermaidFilesInDirectory("tests/incorrect");
  
  assertExists(results);
  assertEquals(results.length > 0, true);
  
  // All files in incorrect folder should be invalid
  results.forEach(result => {
    assertEquals(result.isValid, false, `File ${result.filePath} should be invalid`);
    assertEquals(result.errors.length > 0, true, `File ${result.filePath} should have errors`);
  });
});

Deno.test("checkMermaidFilesInDirectory - non-existent folder", async () => {
  const results = await checkMermaidFilesInDirectory("tests/non-existent");
  
  assertExists(results);
  assertEquals(results.length, 0);
});
