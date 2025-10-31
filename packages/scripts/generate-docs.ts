import path from "path";
import { Project, SyntaxKind } from "ts-morph";

const ROOT = process.cwd();

const project = new Project({
  tsConfigFilePath: path.join(ROOT, "tsconfig.json"),
});

// Include backend + utils + shared files
project.addSourceFilesAtPaths([
  "apps/be/**/*.ts",
  "packages/utils/**/*.ts",
  "packages/db/*.ts",
  "packages/ui/**/*.tsx",
  "apps/web/**/**/*.tsx",
  "apps/web/**/**/*.ts",
]);

const files = project.getSourceFiles();

/**
 * Generates inferred JSDoc for a given function-like declaration.
 */
function generateDocs(entity: any, name: string, isArrow = false) {
  const params = entity.getParameters().map((p: any) => ({
    name: p.getName(),
    type: p.getType().getText(),
  }));

  const returnType = entity.getReturnType().getText();
  const description = `${isArrow ? "Executes" : "Performs"} ${name
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()} operation.`;

  entity.addJsDoc({
    description,
    tags: [
      ...params.map((param: any) => ({
        tagName: "param",
        text: `{${param.type}} ${param.name} - Description of ${param.name}`,
      })),
      {
        tagName: "returns",
        text: `{${returnType}} Description of return value`,
      },
    ],
  });

  console.log(` Added docs for ${isArrow ? "arrow " : ""}function: ${name}`);
}

for (const file of files) {
  // --- Handle named functions ---
  for (const func of file.getFunctions()) {
    const name = func.getName();
    if (!name || func.getJsDocs().length > 0) continue;
    generateDocs(func, name);
  }

  // --- Handle arrow functions exported as constants ---
  for (const variable of file.getVariableDeclarations()) {
    const initializer = variable.getInitializer();
    if (!initializer || initializer.getKind() !== SyntaxKind.ArrowFunction)
      continue;

    const name = variable.getName();

    const existingDocs = initializer.getJsDocs();
    if (existingDocs.length > 0) continue;

    generateDocs(initializer, name, true);
  }
}

await project.save();
console.log("Auto-generated JSDocs with inferred types!");
