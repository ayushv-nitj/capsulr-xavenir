"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Registration is handled automatically via Google Sign-In.
// New users are created on first login, so redirect here.
export default function Register() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, []);

  return null;
}