import { type JSX } from "react";

/**
 * Performs not authenticated operation.
 * @param {{ _children: React.ReactNode; _className?: string; }} props
 * @returns {React.JSX.Element}
 */
export function notAuthenticated({
  _children,
  _className,
}: {
  _children: React.ReactNode;
  _className?: string;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Not Authenticated</h1>
        <p className="text-lg text-gray-600">
          You are not authenticated to view this page.
        </p>
      </div>
    </div>
  );
}
