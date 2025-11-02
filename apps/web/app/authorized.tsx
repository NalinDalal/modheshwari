"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Performs use auth operation.
 * @returns {{ token: string; loading: boolean; }} Description of return value
 */
export function useAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      localStorage.setItem("fh_token", urlToken);
      setToken(urlToken);
      setLoading(false);
    } else {
      const stored = localStorage.getItem("fh_token");
      if (!stored) router.push("/signin");
      else {
        setToken(stored);
        setLoading(false);
      }
    }
  }, [router]);

  return { token, loading };
}
