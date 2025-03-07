"use client";

import { UpProvider } from "@/components/upProvider";
import React, { useState, useEffect } from "react";
import StoryAdventure from "@/components/StoryAdventure";
import StoryExplainer from "@/components/StoryExplainer";

// Import the LUKSO web-components library
let promise: Promise<unknown> | null = null;
if (typeof window !== "undefined") {
  promise = import("@lukso/web-components");
}

/**
 * Main content component that handles the conditional rendering of Donate and ProfileSearch components.
 * Utilizes the UpProvider context to manage selected addresses and search state.
 *
 * @component
 * @returns {JSX.Element} A component that toggles between Donate and ProfileSearch views
 * based on the isSearching state from UpProvider.
 */
function MainContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load web component here if needed
    promise?.then(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return null; // or a loading placeholder
  }

  return (
    <>
      <div
        className="
        min-h-screen bg-gradient-to-br from-gray-900 to-purple-900
        flex flex-col items-center justify-center
        p-4 md:p-8 lg:p-12
      "
      >
        <div
          className="
          w-full max-w-4xl
          bg-gray-800/60 backdrop-blur-md
          rounded-2xl shadow-2xl
          p-6 md:p-10
        "
        >
          <div className="flex items-center justify-center space-x-3 mb-3">
            <img
              src="/universal-story.png"
              alt="Universal Story Logo"
              className="h-12 md:h-10 object-contain"
            />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Universal Story
              </h2>
              <p className="text-sm md:text-md font-bold text-white">
                Collaborative Storytelling
              </p>
            </div>
            <StoryExplainer />
          </div>
          <StoryAdventure />
        </div>
      </div>
    </>
  );
}

/**
 * Root component of the application that wraps the main content with the UpProvider context.
 * Serves as the entry point for the donation and profile search functionality.
 *
 * @component
 * @returns {JSX.Element} The wrapped MainContent component with UpProvider context
 */
export default function Home() {
  return (
    <UpProvider>
      <MainContent />
    </UpProvider>
  );
}
