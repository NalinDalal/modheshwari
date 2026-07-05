import { readFile } from "fs/promises";
import { join } from "path";
import yaml from "js-yaml";

export async function GET() {
  try {
    const yamlPath = join(process.cwd(), "../../openapi.yaml");
    const yamlContent = await readFile(yamlPath, "utf-8");
    const spec = yaml.load(yamlContent);

    return new Response(JSON.stringify(spec), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error reading OpenAPI spec:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load OpenAPI spec" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
