// Create a new file: src/utils/profileCache.ts
import React from "react";

// Export cache singletons that will persist across component instances
export const profileImageCache = new Map();
export const fetchInProgress = new Set();
