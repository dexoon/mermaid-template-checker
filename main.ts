interface MermaidCheckResult {
  filePath: string;
  isValid: boolean;
  errors: string[];
}

interface NodeDefinition {
  id: string;
  type: 'rectangled-circle' | 'rectangle' | 'diamond' | 'circle' | 'hexagon' | 'parallelogram';
  label: string;
  lineNumber: number;
}

interface Connection {
  from: string;
  to: string;
  arrowType: '==' | '--';
  comment: string;
  lineNumber: number;
}

export function checkMermaidFile(content: string): MermaidCheckResult {
  const errors: string[] = [];
  
  // Check if file contains mermaid code blocks
  const mermaidBlocks = content.match(/```mermaid\n([\s\S]*?)\n```/g);
  
  if (!mermaidBlocks) {
    errors.push("No mermaid code blocks found");
    return {
      filePath: "",
      isValid: false,
      errors
    };
  }
  
  // Check each mermaid block
  mermaidBlocks.forEach((block, blockIndex) => {
    const mermaidContent = block.replace(/```mermaid\n/, '').replace(/\n```/, '');
    
    if (!mermaidContent.trim()) {
      errors.push(`Mermaid block ${blockIndex + 1} is empty`);
      return;
    }
    
    // Check if it's a flowchart
    const lines = mermaidContent.split('\n');
    const firstLine = lines[0].trim();
    
    if (!firstLine.startsWith('flowchart')) {
      errors.push(`Mermaid block ${blockIndex + 1}: Only flowcharts are validated`);
      return;
    }
    
    // Parse the flowchart
    const parseResult = parseFlowchart(lines, blockIndex + 1);
    errors.push(...parseResult.errors);
  });
  
  return {
    filePath: "",
    isValid: errors.length === 0,
    errors
  };
}

function parseFlowchart(lines: string[], blockNumber: number): { errors: string[] } {
  const errors: string[] = [];
  const nodes: NodeDefinition[] = [];
  const connections: Connection[] = [];

  let currentSection: 'none' | 'nodes' | 'connections' = 'none';
  let nodeSectionFound = false;
  let connectionSectionFound = false;

  let i = 1;
  while (i < lines.length) {
    let line = lines[i].trim();
    const lineNumber = i + 1;

    // Skip empty lines
    if (!line) { i++; continue; }

    // Check for section markers
    if (line === '%% Node Definitions') {
      if (currentSection !== 'none') {
        errors.push(`Block ${blockNumber}, line ${lineNumber}: Node Definitions section must come first`);
        return { errors };
      }
      currentSection = 'nodes';
      nodeSectionFound = true;
      i++;
      continue;
    }

    if (line === '%% Connections') {
      if (currentSection !== 'nodes') {
        errors.push(`Block ${blockNumber}, line ${lineNumber}: Connections section must come after Node Definitions`);
        return { errors };
      }
      currentSection = 'connections';
      connectionSectionFound = true;
      i++;
      continue;
    }

    // Check for connection syntax in wrong section
    if (currentSection === 'nodes' && line.includes('==') && line.includes('==>')) {
      errors.push(`Block ${blockNumber}, line ${lineNumber}: Connection syntax found in Node Definitions section`);
      return { errors };
    }

    // Parse content based on current section
    if (currentSection === 'nodes') {
      // Try to parse as single-line node
      let nodeResult = parseNodeDefinition(line, lineNumber, blockNumber);
      if (nodeResult.error) {
        // Try multi-line node
        const multiLineStart = getMultiLineNodeStart(line);
        if (multiLineStart) {
          let labelLines = [multiLineStart.labelStart];
          let foundEnd = false;
          let j = i + 1;
          while (j < lines.length) {
            const nextLine = lines[j];
            labelLines.push(nextLine);
            if (nextLine.trim().endsWith(multiLineStart.closing)) {
              foundEnd = true;
              break;
            }
            j++;
          }
          if (foundEnd) {
            // Reconstruct the full node definition
            const fullLabel = labelLines.join('\n');
            const fullLine = `${multiLineStart.prefix}${fullLabel}`;
            const nodeResult2 = parseNodeDefinition(fullLine, lineNumber, blockNumber);
            if (nodeResult2.error) {
              errors.push(nodeResult2.error);
            } else if (nodeResult2.node) {
              nodes.push(nodeResult2.node);
            }
            i = j + 1;
            continue;
          } else {
            errors.push(`Block ${blockNumber}, line ${lineNumber}: Unterminated multi-line node definition`);
            i = j;
            continue;
          }
        } else {
          errors.push(nodeResult.error);
        }
      } else if (nodeResult.node) {
        nodes.push(nodeResult.node);
      }
    } else if (currentSection === 'connections') {
      const connectionResult = parseConnection(line, lineNumber, blockNumber);
      if (connectionResult.error) {
        errors.push(connectionResult.error);
      } else if (connectionResult.connection) {
        connections.push(connectionResult.connection);
      }
    } else {
      errors.push(`Block ${blockNumber}, line ${lineNumber}: Content outside of Node Definitions or Connections sections`);
    }
    i++;
  }

  // Validate sections exist
  if (!nodeSectionFound) {
    errors.push(`Block ${blockNumber}: Missing "%% Node Definitions" section`);
  }
  if (!connectionSectionFound) {
    errors.push(`Block ${blockNumber}: Missing "%% Connections" section`);
  }

  // Validate connections reference valid nodes
  connections.forEach(conn => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);

    if (!fromNode) {
      errors.push(`Block ${blockNumber}, line ${conn.lineNumber}: Connection references undefined node "${conn.from}"`);
    }
    if (!toNode) {
      errors.push(`Block ${blockNumber}, line ${conn.lineNumber}: Connection references undefined node "${conn.to}"`);
    }
  });

  return { errors };
}

function getMultiLineNodeStart(line: string): { prefix: string, labelStart: string, closing: string } | null {
  // Patterns for multi-line node starts
  const patterns = [
    // Rectangled-circle: NODE_ID("Label
    { regex: /^([A-Za-z0-9_]+)\("([^"]*)$/, closing: '")' },
    // Rectangle: NODE_ID["Label
    { regex: /^([A-Za-z0-9_]+)\["([^"]*)$/, closing: '"]' },
    // Diamond: NODE_ID{"Label
    { regex: /^([A-Za-z0-9_]+)\{"([^"]*)$/, closing: '"}' },
    // Circle: NODE_ID(("Label
    { regex: /^([A-Za-z0-9_]+)\(\("([^"]*)$/, closing: '"))' },
    // Hexagon: NODE_ID{{"Label
    { regex: /^([A-Za-z0-9_]+)\{\{"([^"]*)$/, closing: '"}}' },
    // Parallelogram: NODE_ID[/"Label
    { regex: /^([A-Za-z0-9_]+)\[\/"([^"]*)$/, closing: '"/]' }
  ];
  for (const pattern of patterns) {
    const match = line.match(pattern.regex);
    if (match) {
      return {
        prefix: match[1] + line.slice(match[1].length, match[0].length - match[2].length) ,
        labelStart: match[2],
        closing: pattern.closing
      };
    }
  }
  return null;
}

function parseNodeDefinition(line: string, lineNumber: number, blockNumber: number): { node?: NodeDefinition; error?: string } {
  // Node patterns for single-line labels
  const patterns = [
    // Rectangled-circle: NODE_ID("Label")
    { regex: /^([A-Za-z0-9_]+)\("([^"]*)"\)$/, type: 'rectangled-circle' as const },
    // Rectangle: NODE_ID["Label"]
    { regex: /^([A-Za-z0-9_]+)\["([^"]*)"\]$/, type: 'rectangle' as const },
    // Diamond: NODE_ID{"Label"}
    { regex: /^([A-Za-z0-9_]+)\{"([^"]*)"\}$/, type: 'diamond' as const },
    // Circle: NODE_ID(("Label"))
    { regex: /^([A-Za-z0-9_]+)\(\("([^"]*)"\)\)$/, type: 'circle' as const },
    // Hexagon: NODE_ID{{"Label"}}
    { regex: /^([A-Za-z0-9_]+)\{\{"([^"]*)"\}\}$/, type: 'hexagon' as const },
    // Parallelogram: NODE_ID[/"Label"/]
    { regex: /^([A-Za-z0-9_]+)\[\/"([^"]*)"\/\]$/, type: 'parallelogram' as const }
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern.regex);
    if (match) {
      const nodeId = match[1];
      const label = match[2];
      
      // Validate the label content according to node type
      const labelValidation = validateNodeLabel(label, pattern.type, lineNumber, blockNumber);
      if (labelValidation.error) {
        return { error: labelValidation.error };
      }
      
      return {
        node: {
          id: nodeId,
          type: pattern.type,
          label: label,
          lineNumber
        }
      };
    }
  }
  
  return {
    error: `Block ${blockNumber}, line ${lineNumber}: Invalid node definition syntax. Expected one of: NODE_ID("Label"), NODE_ID["Label"], NODE_ID{"Label"}, NODE_ID(("Label")), NODE_ID{{"Label"}}, NODE_ID[/"Label"/]`
  };
}

function validateNodeLabel(label: string, nodeType: string, lineNumber: number, blockNumber: number): { error?: string } {
  // For Rectangle nodes, check the new Rectangle Node definition rules
  if (nodeType === 'rectangle') {
    return validateRectangleNodeLabel(label, lineNumber, blockNumber);
  }
  
  // For other node types, no specific validation required
  // They can have any content as long as it's properly quoted
  return {};
}

function validateRectangleNodeLabel(label: string, lineNumber: number, blockNumber: number): { error?: string } {
  // Rectangle nodes should have 3 parts: text, media, buttons
  // At least one of text or media must be present
  
  // Check for text/caption in slashes
  const textMatches = label.match(/\/[^\/]*\//g) || [];
  
  // Check for media in double slashes
  const mediaMatches = label.match(/\/\/[^\/]*\/\//g) || [];
  
  // Check for buttons
  const inlineButtons = (label.match(/\[[^\]]+\]/g) || []).filter(btn => !btn.startsWith('[['));
  const replyButtons = (label.match(/\[\[[^\]]+\]\]/g) || []);
  
  // At least one of text or media must be present
  if (textMatches.length === 0 && mediaMatches.length === 0) {
    return {
      error: `Block ${blockNumber}, line ${lineNumber}: Rectangle node must contain at least text (/text/) or media (//media//)`
    };
  }
  
  // Check for variables in text (should be {$variable} format)
  const textContent = textMatches.join('');
  const variables = (textContent.match(/\{\$[^}]+\}/g) || []);
  const templates = (textContent.match(/\(\([^)]+\)\)/g) || []);
  
  // All validations passed for Rectangle nodes
  return {};
}

function parseConnection(line: string, lineNumber: number, blockNumber: number): { connection?: Connection; error?: string } {
  // Connection pattern: FROM_NODE == "User action" ==> TO_NODE or FROM_NODE -- "User action" --> TO_NODE
  const pattern = /^([A-Za-z0-9_]+)\s*(==|--)\s*"([^"]*)"\s*(==>|-->)\s*([A-Za-z0-9_]+)$/;
  const match = line.match(pattern);
  
  if (!match) {
    return {
      error: `Block ${blockNumber}, line ${lineNumber}: Invalid connection syntax. Expected: FROM_NODE == "User action" ==> TO_NODE or FROM_NODE -- "User action" --> TO_NODE`
    };
  }
  
  const [, fromNode, arrowType, comment, arrowEnd, toNode] = match;
  
  // Validate arrow consistency
  if ((arrowType === '==' && arrowEnd !== '==>') || (arrowType === '--' && arrowEnd !== '-->')) {
    return {
      error: `Block ${blockNumber}, line ${lineNumber}: Inconsistent arrow types. Use == with ==> or -- with -->`
    };
  }
  
  // Validate comment format
  if (!isValidComment(comment)) {
    return {
      error: `Block ${blockNumber}, line ${lineNumber}: Invalid comment format. Expected: [Button Text], //media//, or plain text`
    };
  }
  
  return {
    connection: {
      from: fromNode,
      to: toNode,
      arrowType: arrowType as '==' | '--',
      comment,
      lineNumber
    }
  };
}

function isValidComment(comment: string): boolean {
  // Button format: [Button Text]
  if (/^\[[^\]]+\]$/.test(comment)) {
    return true;
  }
  
  // Media format: //photo//, //video//
  if (/^\/\/[^\/]+\/\/$/.test(comment)) {
    return true;
  }
  
  // Plain text (no special formatting)
  if (!comment.includes('[') && !comment.includes(']') && !comment.includes('//')) {
    return true;
  }
  
  return false;
}

export async function checkMermaidFilesInDirectory(dirPath: string, recursive: boolean = true): Promise<MermaidCheckResult[]> {
  const results: MermaidCheckResult[] = [];
  
  try {
    if (recursive) {
      await checkMermaidFilesRecursive(dirPath, results);
    } else {
      const entries = Deno.readDir(dirPath);
      
      for await (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.md')) {
          const filePath = `${dirPath}/${entry.name}`;
          const content = await Deno.readTextFile(filePath);
          const result = checkMermaidFile(content);
          result.filePath = filePath;
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return results;
}

async function checkMermaidFilesRecursive(dirPath: string, results: MermaidCheckResult[]): Promise<void> {
  try {
    const entries = Deno.readDir(dirPath);
    
    for await (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;
      
      if (entry.isFile && entry.name.endsWith('.md')) {
        const content = await Deno.readTextFile(fullPath);
        const result = checkMermaidFile(content);
        result.filePath = fullPath;
        results.push(result);
      } else if (entry.isDirectory) {
        // Recursively check subdirectories
        await checkMermaidFilesRecursive(fullPath, results);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length === 0) {
    console.log("Usage: deno run main.ts <directory_path> [--no-recursive]");
    console.log("Example: deno run main.ts tests/correct");
    console.log("Example: deno run main.ts tests/correct --no-recursive");
    console.log("\nBy default, searches recursively through all subdirectories.");
    console.log("Use --no-recursive to search only the specified directory.");
    Deno.exit(1);
  }
  
  const dirPath = args[0];
  const noRecursive = args.includes('--no-recursive');
  const recursive = !noRecursive;
  
  console.log(`Checking mermaid files in: ${dirPath} (${recursive ? 'recursive' : 'non-recursive'})`);
  
  const results = await checkMermaidFilesInDirectory(dirPath, recursive);
  
  let hasErrors = false;
  
  results.forEach(result => {
    console.log(`\nFile: ${result.filePath}`);
    console.log(`Valid: ${result.isValid ? '✅' : '❌'}`);
    if (result.errors.length > 0) {
      hasErrors = true;
      console.log('Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
  });
  
  if (hasErrors) {
    console.log('\n❌ Some files contain errors. Exiting with code 1.');
    Deno.exit(1);
  } else {
    console.log('\n✅ All files are valid!');
  }
}
