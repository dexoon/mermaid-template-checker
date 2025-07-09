import { checkMermaidFile } from './main.ts';

const content = await Deno.readTextFile('tests/incorrect/wrong-connection-syntax.md');
const result = checkMermaidFile(content);
console.log('Valid:', result.isValid);
console.log('Errors:', result.errors);
