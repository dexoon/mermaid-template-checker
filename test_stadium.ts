import { checkMermaidFile } from "./main.ts";

const filePath = "tests/stadium-example.md";
const content = await Deno.readTextFile(filePath);

const result = checkMermaidFile(content);
console.log("File:", filePath);
console.log("Valid:", result.isValid);
console.log("Errors:", result.errors);
