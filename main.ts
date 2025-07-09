interface MermaidCheckResult {
  filePath: string;
  isValid: boolean;
  errors: string[];
}

interface NodeDefinition {
  id: string;
  type: 'rectangled-circle' | 'rectangle' | 'diamond' | 'circle' | 'hexagon' | 'parallelogram' | 'stadium';
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
    // Files that contain no flowchart are not considered errors
    return {
      filePath: "",
      isValid: true,
      errors: []
    };
  }
  
  // Check each mermaid block
  let searchIndex = 0;
  mermaidBlocks.forEach((block, blockIndex) => {
    const mermaidContent = block.replace(/```mermaid\n/, '').replace(/\n```/, '');
    
    // Find the starting line number of this mermaid block in the file
    const blockStartIndex = content.indexOf(block, searchIndex);
    searchIndex = blockStartIndex + block.length;
    const linesBeforeBlock = content.substring(0, blockStartIndex).split('\n').length;
    const mermaidBlockStartLine = linesBeforeBlock; // Line where ```mermaid appears
    
    if (!mermaidContent.trim()) {
      errors.push(`Mermaid block ${blockIndex + 1} (file line ${mermaidBlockStartLine}) is empty`);
      return;
    }
    
    // Check if it's a flowchart
    const lines = mermaidContent.split('\n');
    const firstLine = lines[0].trim();
    
    if (!firstLine.startsWith('flowchart')) {
      errors.push(`Mermaid block ${blockIndex + 1} (file line ${mermaidBlockStartLine + 1}): Only flowcharts are validated`);
      return;
    }
    
    // Parse the flowchart
    const parseResult = parseFlowchart(lines, blockIndex + 1, mermaidBlockStartLine);
    errors.push(...parseResult.errors);
  });
  
  return {
    filePath: "",
    isValid: errors.length === 0,
    errors
  };
}

function parseFlowchart(lines: string[], blockNumber: number, fileLineOffset: number): { errors: string[] } {
  const errors: string[] = [];
  const nodes: NodeDefinition[] = [];
  const connections: Connection[] = [];

  let currentSection: 'none' | 'nodes' | 'connections' = 'none';
  let nodeSectionFound = false;
  let connectionSectionFound = false;

  let i = 1;
  while (i < lines.length) {
    const line = lines[i].trim();
    const lineNumber = i + 1;
    const fileLineNumber = fileLineOffset + lineNumber;

    // Skip empty lines
    if (!line) { i++; continue; }

    // Check for section markers
    if (line === '%% Node Definitions') {
      if (currentSection !== 'none') {
        errors.push(`Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Node Definitions section must come first`);
        return { errors };
      }
      currentSection = 'nodes';
      nodeSectionFound = true;
      i++;
      continue;
    }

    if (line === '%% Connections') {
      if (currentSection !== 'nodes') {
        errors.push(`Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Connections section must come after Node Definitions`);
        return { errors };
      }
      currentSection = 'connections';
      connectionSectionFound = true;
      i++;
      continue;
    }

    // Check for connection syntax in wrong section
    if (currentSection === 'nodes' && line.includes('==') && line.includes('==>')) {
      errors.push(`Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Connection syntax found in Node Definitions section`);
      return { errors };
    }

    // Parse content based on current section
    if (currentSection === 'nodes') {
      // Try to parse as single-line node
      const nodeResult = parseNodeDefinition(line, lineNumber, blockNumber, fileLineNumber);
      if (nodeResult.error) {
        // Try multi-line node
        const multiLineStart = getMultiLineNodeStart(line);
        if (multiLineStart) {
          const labelLines = [multiLineStart.labelStart];
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
            const nodeResult2 = parseNodeDefinition(fullLine, lineNumber, blockNumber, fileLineNumber);
            if (nodeResult2.error) {
              errors.push(nodeResult2.error);
            } else if (nodeResult2.node) {
              nodes.push(nodeResult2.node);
            }
            i = j + 1;
            continue;
          } else {
            errors.push(`Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Unterminated multi-line node definition`);
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
      const connectionResult = parseConnection(line, lineNumber, blockNumber, fileLineNumber);
      if (connectionResult.error) {
        errors.push(connectionResult.error);
      } else if (connectionResult.connection) {
        connections.push(connectionResult.connection);
      }
    } else {
      errors.push(`Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Content outside of Node Definitions or Connections sections`);
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
      errors.push(`Block ${blockNumber}, line ${conn.lineNumber} (file line ${fileLineOffset + conn.lineNumber}): Connection references undefined node "${conn.from}"`);
    }
    if (!toNode) {
      errors.push(`Block ${blockNumber}, line ${conn.lineNumber} (file line ${fileLineOffset + conn.lineNumber}): Connection references undefined node "${conn.to}"`);
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
    // Hexagon (double curly): NODE_ID{{"Label
    { regex: /^([A-Za-z0-9_]+)\{\{"([^"]*)$/, closing: '"}}' },
    // Diamond (single curly): NODE_ID{"Label
    { regex: /^([A-Za-z0-9_]+)\{"([^"]*)$/, closing: '"}' },
    // Circle: NODE_ID(("Label
    { regex: /^([A-Za-z0-9_]+)\(\("([^"]*)$/, closing: '"))' },
    // Parallelogram: NODE_ID[/"Label
    { regex: /^([A-Za-z0-9_]+)\[\/"([^"]*)$/, closing: '"/]' },
    // Stadium: NODE_ID(["Label
    { regex: /^([A-Za-z0-9_]+)\(\["([^"]*)$/, closing: '"])' }
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

function parseNodeDefinition(line: string, lineNumber: number, blockNumber: number, fileLineNumber: number): { node?: NodeDefinition; error?: string } {
  // Node patterns for single-line labels
  const patterns = [
    // Rectangled-circle: NODE_ID("Label")
    { regex: /^([A-Za-z0-9_]+)\("([\s\S]*)"\)$/, type: 'rectangled-circle' as const },
    // Rectangle: NODE_ID["Label"]
    { regex: /^([A-Za-z0-9_]+)\["([\s\S]*)"\]$/, type: 'rectangle' as const },
    // Hexagon: NODE_ID{{"Label"}} (double curly braces)
    { regex: /^([A-Za-z0-9_]+)\{\{"([\s\S]*)"\}\}$/, type: 'hexagon' as const },
    // Diamond: NODE_ID{"Label"} (single curly braces)
    { regex: /^([A-Za-z0-9_]+)\{"([\s\S]*)"\}$/, type: 'diamond' as const },
    // Circle: NODE_ID(("Label"))
    { regex: /^([A-Za-z0-9_]+)\(\("([\s\S]*)"\)\)$/, type: 'circle' as const },
    // Parallelogram: NODE_ID[/"Label"/]
    { regex: /^([A-Za-z0-9_]+)\[\/"([\s\S]*)"\/\]$/, type: 'parallelogram' as const },
    // Stadium: NODE_ID(["Label"])
    { regex: /^([A-Za-z0-9_]+)\(\["([\s\S]*)"\]\)$/, type: 'stadium' as const }
  ];
  for (const pattern of patterns) {
    const match = line.match(pattern.regex);
    if (match) {
      const nodeId = match[1];
      const label = match[2];
      // For diamond/hexagon, disambiguate by id or context if needed (here, just assign as found)
      // Validate the label content according to node type
      const labelValidation = validateNodeLabel(label, pattern.type, lineNumber, blockNumber, fileLineNumber);
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
    error: `Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Invalid node definition syntax. Expected one of: NODE_ID("Label"), NODE_ID["Label"], NODE_ID{"Label"}, NODE_ID{{"Label"}}, NODE_ID(("Label")), NODE_ID[/"Label"/], NODE_ID(["Label"])`
  };
}

function validateNodeLabel(label: string, nodeType: string, lineNumber: number, blockNumber: number, fileLineNumber: number): { error?: string } {
  // For Rectangle nodes, check the new Rectangle Node definition rules
  if (nodeType === 'rectangle') {
    return validateRectangleNodeLabel(label, lineNumber, blockNumber, fileLineNumber);
  }
  
  // For other node types, no specific validation required
  // They can have any content as long as it's properly quoted
  return {};
}

function validateRectangleNodeLabel(label: string, lineNumber: number, blockNumber: number, fileLineNumber: number): { error?: string } {
  // Rectangle nodes should have 3 parts: text, media, buttons
  // First or second parts can be omitted, but not both
  
  // Check for text/caption in slashes
  const textMatches = label.match(/\/[^\/]*\//g) || [];
  
  // Check for media in double slashes
  const mediaMatches = label.match(/\/\/[^\/]*\/\//g) || [];
  
  // Check for buttons
  const _inlineButtons = (label.match(/\[[^\]]+\]/g) || []).filter(btn => !btn.startsWith('[['));
  const _replyButtons = (label.match(/\[\[[^\]]+\]\]/g) || []);
  
  // At least one of text or media must be present
  if (textMatches.length === 0 && mediaMatches.length === 0) {
    return {
      error: `Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Rectangle node must contain at least text (/text/) or media (//media//)`
    };
  }
  
  // Validate that button ordering is correct - buttons can contain both types, 
  // but can contain many buttons of the same type
  // No additional validation needed for this as per the rules
  
  // Check for variables in text (should be {$variable} format)
  const textContent = textMatches.join('');
  const _variables = (textContent.match(/\{\$[^}]+\}/g) || []);
  const _templates = (textContent.match(/\(\([^)]+\)\)/g) || []);
  
  // All validations passed for Rectangle nodes
  return {};
}

function parseConnection(line: string, lineNumber: number, blockNumber: number, fileLineNumber: number): { connection?: Connection; error?: string } {
  // Connection pattern: FROM_NODE == "User action" ==> TO_NODE or FROM_NODE ==> TO_NODE (without comment)
  
  // Try pattern with comment first
  const patternWithComment = /^([A-Za-z0-9_]+)\s*(==|--)\s*"([^"]*)"\s*(==>|-->)\s*([A-Za-z0-9_]+)$/;
  const matchWithComment = line.match(patternWithComment);
  
  if (matchWithComment) {
    const [, fromNode, arrowType, comment, arrowEnd, toNode] = matchWithComment;
    
    // Validate arrow consistency
    if ((arrowType === '==' && arrowEnd !== '==>') || (arrowType === '--' && arrowEnd !== '-->')) {
      return {
        error: `Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Inconsistent arrow types. Use == with ==> or -- with -->`
      };
    }
    
    // Validate comment format
    if (!isValidComment(comment)) {
      return {
        error: `Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Invalid comment format. Expected: [Button Text], //media//, or plain text`
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
  
  // Try pattern without comment
  const patternWithoutComment = /^([A-Za-z0-9_]+)\s*(==>|-->)\s*([A-Za-z0-9_]+)$/;
  const matchWithoutComment = line.match(patternWithoutComment);
  
  if (matchWithoutComment) {
    const [, fromNode, arrow, toNode] = matchWithoutComment;
    const arrowType = arrow.startsWith('==') ? '==' : '--';
    
    return {
      connection: {
        from: fromNode,
        to: toNode,
        arrowType: arrowType as '==' | '--',
        comment: '', // Empty comment
        lineNumber
      }
    };
  }
  
  return {
    error: `Block ${blockNumber}, line ${lineNumber} (file line ${fileLineNumber}): Invalid connection syntax. Expected: FROM_NODE -- "User action" --> TO_NODE or FROM_NODE ==> TO_NODE`
  };
}

function isValidComment(comment: string): boolean {
  // Button format: [Button Text] - single inline button only
  if (/^\[[^\]]+\]$/.test(comment)) {
    return true;
  }
  
  // Reply button format: [[Button Text]] - single reply button only
  if (/^\[\[[^\]]+\]\]$/.test(comment)) {
    return true;
  }
  
  // Media format: //photo//, //video// - single media only
  if (/^\/\/[^\/]+\/\/$/.test(comment)) {
    return true;
  }
  
  // Plain text (no special formatting)
  if (!comment.includes('[') && !comment.includes(']') && !comment.includes('//')) {
    return true;
  }
  
  // Check for mixed button types or multiple buttons/media in comments
  const inlineButtons = (comment.match(/\[[^\]]+\]/g) || []).filter(btn => !btn.startsWith('[['));
  const replyButtons = comment.match(/\[\[[^\]]+\]\]/g) || [];
  const media = comment.match(/\/\/[^\/]+\/\//g) || [];
  
  // If multiple types are found, it's invalid
  const typeCount = (inlineButtons.length > 0 ? 1 : 0) + 
                   (replyButtons.length > 0 ? 1 : 0) + 
                   (media.length > 0 ? 1 : 0);
  
  if (typeCount > 1) {
    return false;
  }
  
  // If multiple items of the same type are found, it's invalid for comments
  if (inlineButtons.length > 1 || replyButtons.length > 1 || media.length > 1) {
    return false;
  }
  
  return false;
}

export async function checkMermaidFilesInDirectory(dirPath: string, recursive: boolean = true, filenameTemplate?: string): Promise<MermaidCheckResult[]> {
  const results: MermaidCheckResult[] = [];
  
  try {
    if (recursive) {
      await checkMermaidFilesRecursive(dirPath, results, filenameTemplate);
    } else {
      const entries = Deno.readDir(dirPath);
      
      for await (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.md')) {
          // Check if filename matches template
          if (filenameTemplate && !matchesFilenameTemplate(entry.name, filenameTemplate)) {
            continue;
          }
          
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

async function checkMermaidFilesRecursive(dirPath: string, results: MermaidCheckResult[], filenameTemplate?: string): Promise<void> {
  try {
    const entries = Deno.readDir(dirPath);
    
    for await (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;
      
      if (entry.isFile && entry.name.endsWith('.md')) {
        // Check if filename matches template
        if (filenameTemplate && !matchesFilenameTemplate(entry.name, filenameTemplate)) {
          continue;
        }
        
        const content = await Deno.readTextFile(fullPath);
        const result = checkMermaidFile(content);
        result.filePath = fullPath;
        results.push(result);
      } else if (entry.isDirectory) {
        // Recursively check subdirectories
        await checkMermaidFilesRecursive(fullPath, results, filenameTemplate);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
}

function matchesFilenameTemplate(filename: string, template: string): boolean {
  // Escape regex special characters except * and ?
  const escaped = template.replace(/([.+^${}()|[\]\\])/g, '\\$1');
  // Replace * with .*, ? with .
  const regexPattern = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');

  const regex = new RegExp(`^${regexPattern}$`);
  const matches = regex.test(filename);

  return matches;
}

// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  const args = Deno.args;
  
  if (args.length === 0) {
    console.log("Usage: deno run main.ts <directory_path> [--no-recursive] [--template <filename_template>]");
    console.log("Example: deno run main.ts tests/correct");
    console.log("Example: deno run main.ts tests/correct --no-recursive");
    console.log("Example: deno run main.ts tests/correct --template 'test-*.md'");
    console.log("Example: deno run main.ts tests/correct --template 'flowchart-*.md'");
    console.log("\nBy default, searches recursively through all subdirectories.");
    console.log("Use --no-recursive to search only the specified directory.");
    console.log("Use --template to filter files by name pattern (supports * and ? wildcards).");
    Deno.exit(1);
  }
  
  const dirPath = args[0];
  const noRecursive = args.includes('--no-recursive');
  const recursive = !noRecursive;
  
  // Parse filename template argument
  let filenameTemplate: string | undefined;
  const templateIndex = args.indexOf('--template');
  if (templateIndex !== -1 && templateIndex + 1 < args.length) {
    filenameTemplate = args[templateIndex + 1];
  }
  
  console.log(`Checking mermaid files in: ${dirPath} (${recursive ? 'recursive' : 'non-recursive'})`);
  if (filenameTemplate) {
    console.log(`Using filename template: ${filenameTemplate}`);
  }
  
  const results = await checkMermaidFilesInDirectory(dirPath, recursive, filenameTemplate);
  
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
