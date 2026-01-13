"use client";

import { Suspense } from "react";
import { LoaderOne } from "@repo/ui/loading";

import FamilyPageContent from "./FamilyPageContent";

/**
 * Family Page (Client Component)
 *
 * This is the **entry point** for the `/family` route in the app.
 * It wraps the `FamilyPageContent` component inside a `<Suspense>` boundary
 * to ensure proper handling of client-only hooks such as `useSearchParams()`.
 *
 * ---
 * ### Why Suspense?
 * - React hooks like `useSearchParams()` **cannot run on the server**.
 * - Without Suspense, Next.js throws a build-time error since the page attempts
 *   to access client-side features during prerendering.
 * - Wrapping with `<Suspense>` tells React: “Wait until client hydration
 *   before rendering this part of the component tree.”
 *
 * ---
 * ### Fallback
 * - The `fallback` prop displays a temporary loading UI while the client
 *   initializes and any required asynchronous data or state becomes available.
 * - You can later replace `<div>Loading...</div>` with a richer loader such as
 *   `<LoaderOne />` from `@repo/ui/loading` for a more consistent UX.
 *
 * ---
 * @component
 * @example
 * ```tsx
 * export default function FamilyPage() {
 *   return (
 *     <Suspense fallback={<LoaderOne />}>
 *       <FamilyPageContent />
 *     </Suspense>
 *   );
 * }
 * ```
 *
 * @returns {JSX.Element} Suspense-wrapped family page content.
 */
export default function FamilyPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoaderOne />}>
      <FamilyPageContent />
    </Suspense>
  );
}
