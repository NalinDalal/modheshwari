"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotAuthenticated } from "@repo/ui/not-authenticated";

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.push("/login");
    }, 2500);

    return () => clearTimeout(t);
  }, []);

  return <NotAuthenticated />;
}
