import { assert, assertEquals, assertExists } from "@std/assert";
import { checkMermaidFile, checkMermaidFilesInDirectory } from "./main.ts";

Deno.test("checkMermaidFile - valid flowchart content", () => {
  const validContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
END["/Thank you/"]

%% Connections
START ==> END
\`\`\``;
  
  const result = checkMermaidFile(validContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - rectangle node with text and buttons", () => {
  const rectangleContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
ACTION["/Choose an action/ [Option 1] [Option 2]"]
END["/End/"]

%% Connections
START ==> ACTION
ACTION -- "[Option 1]" --> END
ACTION -- "[Option 2]" --> END
\`\`\``;
  
  const result = checkMermaidFile(rectangleContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - rectangle node with media only", () => {
  const mediaOnlyContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
MEDIA["//image.jpg//"]
END["/End/"]

%% Connections
START ==> MEDIA
MEDIA ==> END
\`\`\``;
  
  const result = checkMermaidFile(mediaOnlyContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - rectangle node with text and media", () => {
  const textAndMediaContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
MEDIA_TEXT["/Here is an image/ //image.jpg//"]
END["/End/"]

%% Connections
START ==> MEDIA_TEXT
MEDIA_TEXT ==> END
\`\`\``;
  
  const result = checkMermaidFile(textAndMediaContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - invalid rectangle node (no text or media)", () => {
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

Deno.test("checkMermaidFile - multi-line node definitions", () => {
  const multiLineContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome
to the jungle/")
END["/Thank you
for your business/"]

%% Connections
START ==> END
\`\`\``;
  
  const result = checkMermaidFile(multiLineContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - variables and templates", () => {
  const variablesContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome {$name}/")
TEMPLATE["/Using template ((template_name))/"]
END["/Bye {$name}/"]

%% Connections
START ==> TEMPLATE
TEMPLATE ==> END
\`\`\``;
  
  const result = checkMermaidFile(variablesContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - reply buttons", () => {
  const replyButtonContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
CHOICE["/Please choose:/ [[Yes]] [[No]]"]
YES_BRANCH["/You chose Yes/"]
NO_BRANCH["/You chose No/"]

%% Connections
START ==> CHOICE
CHOICE -- "[[Yes]]" --> YES_BRANCH
CHOICE -- "[[No]]" --> NO_BRANCH
\`\`\``;
  
  const result = checkMermaidFile(replyButtonContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - missing text/media blocks", () => {
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

Deno.test("checkMermaidFile - mixed button types", () => {
  const mixedButtonContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
CHOICE["/Please choose:/ [Inline] [[Reply]]"]
END["/End/"]

%% Connections
START ==> CHOICE
CHOICE -- "[Inline]" --> END
CHOICE -- "[[Reply]]" --> END
\`\`\``;
  
  const result = checkMermaidFile(mixedButtonContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - unterminated multi-line node", () => {
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
  assertEquals(result.errors.some(e => e.includes("Unterminated multi-line node")), true);
});

Deno.test("checkMermaidFile - invalid flowchart content", () => {
  const invalidContent = `# Test
\`\`\`mermaid
flowchart TD
START("/Welcome/")
END["/Thank you/"]
START --> END
\`\`\``;
  
  const result = checkMermaidFile(invalidContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Content outside of Node Definitions or Connections sections")), true);
});

Deno.test("checkMermaidFile - missing sections", () => {
  const missingSectionsContent = `# Test
\`\`\`mermaid
flowchart TD
START("/Welcome/")
END["/Thank you/"]
START == "Action" ==> END
\`\`\``;
  
  const result = checkMermaidFile(missingSectionsContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Missing \"%% Node Definitions\" section")), true);
});

Deno.test("checkMermaidFile - wrong section order", () => {
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
  assertEquals(result.errors.some(e => e.includes("Connections section must come after Node Definitions")), true);
});

Deno.test("checkMermaidFile - undefined nodes", () => {
  const undefinedNodeContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")

%% Connections
START ==> NON_EXISTENT
\`\`\``;
  
  const result = checkMermaidFile(undefinedNodeContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("references undefined node")), true);
});

Deno.test("checkMermaidFile - invalid node syntax", () => {
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
  assertEquals(result.errors.some(e => e.includes("Invalid node definition syntax")), true);
});

Deno.test("checkMermaidFile - invalid connection syntax", () => {
  const invalidConnectionContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
END["/Thank you/"]

%% Connections
START --invalid--> END
\`\`\``;
  
  const result = checkMermaidFile(invalidConnectionContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("Invalid connection syntax")), true);
});

Deno.test("checkMermaidFile - non-flowchart diagram", () => {
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

Deno.test("checkMermaidFile - empty mermaid block", () => {
  const emptyContent = `# Test
\`\`\`mermaid

\`\`\``;
  
  const result = checkMermaidFile(emptyContent);
  assertEquals(result.isValid, false);
  assertEquals(result.errors.some(e => e.includes("empty")), true);
});

Deno.test("checkMermaidFile - no mermaid blocks", () => {
  const noMermaidContent = `# Test
This is just regular markdown content.
No mermaid blocks here.`;
  
  const result = checkMermaidFile(noMermaidContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - stadium shaped node for FSM transitions", () => {
  const stadiumContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
TRANSITION(["Go to other module"])
END["/Thank you for using our service/"]

%% Connections
START ==> TRANSITION
TRANSITION ==> END
\`\`\``;
  
  const result = checkMermaidFile(stadiumContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - multi-line stadium shaped node", () => {
  const multiLineStadiumContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
TRANSITION(["Go to other module
with multi-line label"])
END["/Thank you for using our service/"]

%% Connections
START ==> TRANSITION
TRANSITION ==> END
\`\`\``;
  
  const result = checkMermaidFile(multiLineStadiumContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
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

Deno.test("checkMermaidFilesInDirectory - with filename template", async () => {
  // Resolve the path to 'tests/correct' relative to this test file
  const testDir = new URL("./tests/correct", import.meta.url).pathname;

  // Test with template1 (should match .md files with node in name)
  const resultsWithTemplate1 = await checkMermaidFilesInDirectory(testDir, true, '*node*.md');
  
  assertExists(resultsWithTemplate1);
  assertEquals(resultsWithTemplate1.length > 0, true);
  
  // All matched files should include at least one file containing 'node' and ending with '.md'
  const filesWithNode = resultsWithTemplate1.filter(result => {
    const fileName = result.filePath.split('/').pop() || '';
    return fileName.includes('node') && fileName.endsWith('.md');
  });
  assert(filesWithNode.length > 0, 'Should match at least one file containing "node" and ending with ".md"');
  
  // Test with template that should match no files
  const resultsWithNoMatchTemplate = await checkMermaidFilesInDirectory(testDir, true, "nonexistent*.md");
  
  assertExists(resultsWithNoMatchTemplate);
  assertEquals(resultsWithNoMatchTemplate.length, 0);
});

Deno.test("checkMermaidFile - connections without comments", () => {
  const connectionContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
PROCESS["/Processing/"]
END["/Thank you for using our service/"]

%% Connections
START ==> PROCESS
PROCESS ==> END
\`\`\``;
  
  const result = checkMermaidFile(connectionContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});

Deno.test("checkMermaidFile - mixed connections with and without comments", () => {
  const mixedConnectionContent = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
PROCESS["/Processing/"]
END["/Thank you for using our service/"]

%% Connections
START -- "User starts" --> PROCESS
PROCESS ==> END
\`\`\``;
  
  const result = checkMermaidFile(mixedConnectionContent);
  assertEquals(result.isValid, true);
  assertEquals(result.errors.length, 0);
});
