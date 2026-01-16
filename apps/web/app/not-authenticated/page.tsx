"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotAuthenticated } from "@repo/ui/not-authenticated";

/**
 * Performs  protected page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/login");
    }, 2500);

    return () => clearTimeout(t);
  }, [router]);

  return <NotAuthenticated />;
}
