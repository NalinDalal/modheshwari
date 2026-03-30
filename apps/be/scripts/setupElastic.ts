#!/usr/bin/env bun
import elasticClient from "../lib/elastic";

async function ensureIndex(name: string, body: any) {
  try {
    const existsResp: any = await elasticClient.indices.exists({ index: name });
    const exists = existsResp && (existsResp.body === true || existsResp === true || existsResp.exists === true);
    if (exists) {
      console.log(`Index ${name} already exists`);
      return;
    }
  } catch (e) {
    // if we can't determine, fall through to creation attempt
  }

  console.log(`Creating index ${name}...`);
  await elasticClient.indices.create({ index: name, body });
  console.log(`Created ${name}`);
}

async function run() {
  console.log("Setting up Elasticsearch indices...");

  // Users index mapping
  const usersMapping = {
    settings: {
      analysis: {
        analyzer: {
          edge_ngram_analyzer: {
            tokenizer: "edge_ngram_tokenizer",
            filter: ["lowercase"]
          }
        },
        tokenizer: {
          edge_ngram_tokenizer: {
            type: "edge_ngram",
            min_gram: 2,
            max_gram: 20,
            token_chars: ["letter", "digit"]
          }
        }
      }
    },
    mappings: {
      properties: {
        id: { type: "keyword" },
        name: {
          type: "text",
          fields: {
            raw: { type: "keyword" },
            suggest: { type: "text", analyzer: "edge_ngram_analyzer" }
          }
        },
        email: { type: "keyword" },
        phone: { type: "keyword" },
        role: { type: "keyword" },
        profile: {
          properties: {
            gotra: { type: "keyword" },
            profession: { type: "keyword" },
            bloodGroup: { type: "keyword" },
            location: { type: "text" }
          }
        },
        location: { type: "geo_point" }
      }
    }
  };

  // Events index mapping
  const eventsMapping = {
    settings: usersMapping.settings,
    mappings: {
      properties: {
        id: { type: "keyword" },
        name: { type: "text", fields: { raw: { type: "keyword" }, suggest: { type: "text", analyzer: "edge_ngram_analyzer" } } },
        description: { type: "text" },
        date: { type: "date" },
        venue: { type: "text" },
        status: { type: "keyword" },
        location: { type: "geo_point" }
      }
    }
  };

  try {
    await ensureIndex("users", usersMapping);
    await ensureIndex("events", eventsMapping);
    console.log("Indices are ready.");
  } catch (err) {
    console.error("Failed to setup indices:", err);
    process.exit(1);
  }
}

run();
