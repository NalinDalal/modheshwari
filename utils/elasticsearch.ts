import { Client } from "@elastic/elasticsearch";

const client = new Client({ node: process.env.ELASTICSEARCH_NODE });

export default client;
