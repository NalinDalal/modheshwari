import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const yamlPath = join(process.cwd(), "../../asyncapi.yaml");
    const yamlContent = await readFile(yamlPath, "utf-8");

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