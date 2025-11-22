"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink } from "lucide-react";
import { ExternalAnchor } from "../(header)";

export function FilterDetectionWarning() {
  const [filterDetected, setFilterDetected] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Create a canary element that matches the filter: .fixed.border
    // Set it to be visible by default, then check if filter hides it
    const canary = document.createElement("div");
    canary.className = "fixed border";
    canary.style.cssText =
      "position: absolute; top: 0; left: 0; width: 1px; height: 1px; opacity: 0; pointer-events: none; display: block !important; visibility: visible !important;";
    document.body.appendChild(canary);

    // Check if it's being hidden by the filter
    setTimeout(() => {
      const computed = window.getComputedStyle(canary);

      // Check if the filter overrode our !important inline styles
      const isHidden =
        computed.display === "none" || computed.visibility === "hidden";

      if (isHidden) {
        setFilterDetected(true);
      }

      document.body.removeChild(canary);
    }, 100);
  }, []);

  if (!isMounted || !filterDetected || isClosed) return null;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          top: "50vh",
          left: "50vw",
          transform: "translate(-50%, -50%)",
          zIndex: 1000120,
          maxWidth: "42rem",
          width: "calc(100% - 2rem)",
          backgroundColor: "#dc2626",
          color: "#fef2f2",
          padding: "1rem",
          borderRadius: "0.5rem",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: "0.125rem" }}
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <div style={{ flex: 1 }}>
            <h5 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
              Ad Blocker Breaking Core Features
            </h5>
            <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              Your ad blocker is using aggressive filters that break essential
              website features including settings, account management, Peer
              Link, whiteboard, and all dialogs.
            </p>
            <p style={{ fontSize: "0.875rem", marginBottom: "0.75rem" }}>
              <strong>Please whitelist TH.GL</strong> to restore full
              functionality.
            </p>
            <ExternalAnchor
              href="https://www.th.gl/blog/ad-blockers-breaking-websites"
              className="inline-flex items-center gap-1 text-sm underline"
              onClick={(e) => {
                window.open(
                  "https://www.th.gl/blog/ad-blockers-breaking-websites",
                  "_blank",
                );
                e.preventDefault();
              }}
            >
              <span>Learn more about this issue</span>
              <ExternalLink className="w-3 h-3" />
            </ExternalAnchor>
          </div>
          <button
            onClick={() => setIsClosed(true)}
            style={{
              flexShrink: 0,
              width: "1.5rem",
              height: "1.5rem",
              borderRadius: "0.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backgroundColor: "transparent",
              border: "none",
              color: "inherit",
              opacity: 0.7,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.backgroundColor =
                "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
