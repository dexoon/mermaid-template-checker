import { checkMermaidFile } from './main.ts';

// Test with comment
const contentWithComment = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
END["/Thank you/"]

%% Connections
START == "User action" ==> END
\`\`\``;

// Test without comment
const contentWithoutComment = `# Test
\`\`\`mermaid
flowchart TD
%% Node Definitions
START("/Welcome/")
END["/Thank you/"]

%% Connections
START ==> END
\`\`\``;

console.log('=== Testing with comment ===');
const result1 = checkMermaidFile(contentWithComment);
console.log('Valid:', result1.isValid);
console.log('Errors:', result1.errors);

console.log('\n=== Testing without comment ===');
const result2 = checkMermaidFile(contentWithoutComment);
console.log('Valid:', result2.isValid);
console.log('Errors:', result2.errors);
