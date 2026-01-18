"use client";

import { useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function SpecPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-full">
        <SwaggerUI
          url="/api/openapi"
          docExpansion="list"
          defaultModelsExpandDepth={1}
          persistAuthorization={true}
        />
      </div>
    </div>
  );
}
