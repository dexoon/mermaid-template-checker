import { checkMermaidFile } from "./main.ts";

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
console.log("Result:", result);
console.log("Valid:", result.isValid);
console.log("Errors:", result.errors);
