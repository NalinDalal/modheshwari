import { readFileSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

/**
 * Performs  g e t operation.
 * @returns {Promise<Response>} Description of return value
 */
export async function GET() {
  try {
    // Read the OpenAPI YAML file from the repo root
    const yamlPath = join(process.cwd(), "../../openapi.yaml");
    const yamlContent = readFileSync(yamlPath, "utf-8");

    // Parse YAML to JSON
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
