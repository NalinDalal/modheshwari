import { readFileSync } from "fs";
import { join } from "path";

/**
 * Performs  g e t operation.
 * @returns {Promise<Response>} Description of return value
 */
export async function GET() {
  try {
    // Read the AsyncAPI YAML file from the repo root
    const yamlPath = join(process.cwd(), "../../asyncapi.yaml");
    const yamlContent = readFileSync(yamlPath, "utf-8");

    // Return raw YAML for better readability
    return new Response(yamlContent, {
      headers: { "Content-Type": "text/yaml" },
    });
  } catch (error) {
    console.error("Error reading AsyncAPI spec:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load AsyncAPI spec" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
