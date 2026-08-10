"use client";

import { useEffect } from "react";
import { ensureSeeded } from "@/lib/db/bootstrap";

export function DbInit() {
  useEffect(() => {
    void ensureSeeded();
  }, []);
  return null;
}
