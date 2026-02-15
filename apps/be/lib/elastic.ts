import { Client } from "@elastic/elasticsearch";

const cloudId = process.env.ELASTIC_CLOUD_ID;
const node = process.env.elastic_node;

const apiKey = process.env.elastic_api_key;
const username = process.env.ELASTIC_USERNAME;
const password = process.env.ELASTIC_PASSWORD;

function buildClient() {
  const auth: any = {};
  if (apiKey) auth.apiKey = apiKey;
  else if (username && password) auth.username = username, auth.password = password;

  if (cloudId) {
    return new Client({ cloud: { id: cloudId }, auth: Object.keys(auth).length ? auth : undefined });
  }

  // fallback to node URL
  const nodeUrl = node || process.env.ELASTIC_URL || "http://localhost:9200";
  return new Client({ node: nodeUrl, auth: Object.keys(auth).length ? auth : undefined });
}

const elasticClient = buildClient();

export default elasticClient;
