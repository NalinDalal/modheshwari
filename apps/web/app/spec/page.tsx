"use client";

import { useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { FileCode, Webhook, Copy, ExternalLink } from "lucide-react";

type SpecType = "openapi" | "asyncapi";

/**
 * API Documentation Page with tabbed interface for OpenAPI and AsyncAPI specs
 * @returns {React.JSX.Element} Spec viewer page
 */
export default function SpecPage() {
  const [specType, setSpecType] = useState<SpecType>("openapi");
  const [asyncApiSpec, setAsyncApiSpec] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Fetch AsyncAPI spec when switching to it
  const handleSpecChange = async (type: SpecType) => {
    setSpecType(type);
    if (type === "asyncapi" && !asyncApiSpec) {
      try {
        const res = await fetch("/api/asyncapi");
        const yamlText = await res.text();
        setAsyncApiSpec(yamlText);
      } catch (err) {
        console.error("Failed to load AsyncAPI spec:", err);
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(asyncApiSpec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            API Documentation
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Browse REST and WebSocket API specifications
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => handleSpecChange("openapi")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                specType === "openapi"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <FileCode className="w-4 h-4" />
              OpenAPI (REST)
            </button>
            <button
              onClick={() => handleSpecChange("asyncapi")}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
                specType === "asyncapi"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Webhook className="w-4 h-4" />
              AsyncAPI (WebSocket)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {specType === "openapi" ? (
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <SwaggerUI
                url="/api/openapi"
                docExpansion="list"
                defaultModelsExpandDepth={1}
                persistAuthorization={true}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Info Card */}
              <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <Webhook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      AsyncAPI Specification
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      This specification describes the WebSocket API for real-time messaging.
                      For the best visualization experience, copy the spec and paste it into AsyncAPI Studio.
                    </p>
                    <a
                      href="https://studio.asyncapi.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open AsyncAPI Studio
                    </a>
                  </div>
                </div>
              </div>

              {/* Spec Display */}
              {asyncApiSpec ? (
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">YAML Specification</h3>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors font-medium"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <pre className="bg-gray-900 dark:bg-black text-gray-100 p-6 rounded-lg overflow-auto max-h-[70vh] text-sm font-mono border border-gray-700">
                    {asyncApiSpec}
                  </pre>
                </div>
              ) : (
                <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 shadow-sm">
                  <div className="flex items-center justify-center">
                    <div className="text-gray-500 dark:text-gray-400">Loading AsyncAPI spec...</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
