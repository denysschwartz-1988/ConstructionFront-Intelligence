"use client";

import type { ReactNode } from "react";
import type { ProjectRecord } from "@/types/database";

type ProjectReportTabProps = {
  project: ProjectRecord;
  isAuthenticated: boolean;
};

const PremiumBlur = ({
  isAuthenticated,
  children
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) => (
  <div style={{ position: "relative" }}>
    <div
      style={{
        filter: isAuthenticated ? "none" : "blur(5px)",
        userSelect: isAuthenticated ? "auto" : "none",
        pointerEvents: isAuthenticated ? "auto" : "none",
        transition: "filter 0.3s ease"
      }}
    >
      {children}
    </div>

    {!isAuthenticated ? (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          backgroundColor: "rgba(13,17,23,0.55)",
          borderRadius: 8,
          zIndex: 10
        }}
      >
        <div style={{ fontSize: 28 }}>{"\u{1f512}"}</div>
        <div style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700 }}>
          Premium Intelligence
        </div>
        <div
          style={{
            color: "#8b949e",
            fontSize: 12,
            textAlign: "center",
            maxWidth: 300,
            lineHeight: 1.6
          }}
        >
          Sign in to access full project intelligence, market signals, source analysis and related projects.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <a
            href="/sign-up"
            style={{
              backgroundColor: "#f0a500",
              color: "#0d1117",
              fontWeight: 700,
              padding: "9px 20px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 13
            }}
          >
            Get Started {"->"}
          </a>
          <a
            href="/sign-in"
            style={{
              backgroundColor: "transparent",
              color: "#e6edf3",
              border: "1px solid #30363d",
              padding: "9px 20px",
              borderRadius: 6,
              textDecoration: "none",
              fontSize: 13
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    ) : null}
  </div>
);

export default function ProjectReportTab({
  project,
  isAuthenticated
}: ProjectReportTabProps) {
  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <PremiumBlur isAuthenticated={isAuthenticated}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              backgroundColor: "#1c2128",
              border: "1px solid #30363d",
              borderRadius: 8,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 12
            }}
          >
            <div style={{ fontSize: 36 }}>{"\u{1f4c4}"}</div>
            <div
              style={{
                color: "#e6edf3",
                fontSize: 16,
                fontWeight: 700
              }}
            >
              Project Report
            </div>
            <div
              style={{
                color: "#8b949e",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 480
              }}
            >
              Generate a consolidated project intelligence report for{" "}
              <span style={{ color: "#e6edf3", fontWeight: 600 }}>
                {project.projectName}
              </span>{" "}
              including project overview, key parties, market signals, milestone
              history and sources, exported as a clean PDF.
            </div>

            <div
              style={{
                backgroundColor: "rgba(240,165,0,0.1)",
                border: "1px solid rgba(240,165,0,0.3)",
                borderRadius: 4,
                padding: "4px 12px",
                color: "#f0a500",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase"
              }}
            >
              Coming Soon
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#1c2128",
              border: "1px solid #30363d",
              borderRadius: 8,
              padding: 20
            }}
          >
            <div
              style={{
                color: "#f0a500",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 16
              }}
            >
              REPORT WILL INCLUDE
            </div>

            {[
              {
                icon: "\u{1f4cb}",
                title: "Project Overview",
                desc: "Full project description, key facts and current status"
              },
              {
                icon: "\u{1f465}",
                title: "Key Parties",
                desc: "All confirmed parties, roles and relationships"
              },
              {
                icon: "\u{1f4ca}",
                title: "Project Key Features",
                desc: "Scale, value, timeline and delivery model"
              },
              {
                icon: "\u{1f4e1}",
                title: "Market Signals",
                desc: "Commercial intelligence and procurement signals"
              },
              {
                icon: "\u{1f4c5}",
                title: "Milestone History",
                desc: "Full development timeline and key events"
              },
              {
                icon: "\u{1f517}",
                title: "Sources",
                desc: "All official sources and CF coverage references"
              }
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid #21262d"
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div
                    style={{
                      color: "#e6edf3",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 2
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      color: "#8b949e",
                      fontSize: 12,
                      lineHeight: 1.5
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: "#1c2128",
              border: "1px solid #30363d",
              borderRadius: 8,
              padding: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16
            }}
          >
            <div>
              <div
                style={{
                  color: "#e6edf3",
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 4
                }}
              >
                Get notified when Project Reports launch
              </div>
              <div style={{ color: "#8b949e", fontSize: 12 }}>
                We'll let you know as soon as PDF export is available.
              </div>
            </div>
            <button
              type="button"
              style={{
                backgroundColor: "#f0a500",
                color: "#0d1117",
                fontWeight: 700,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                fontSize: 12,
                cursor: "pointer",
                flexShrink: 0
              }}
              onClick={() =>
                alert("Thank you! We will notify you when Project Reports are available.")
              }
            >
              Notify Me
            </button>
          </div>
        </div>
      </PremiumBlur>
    </div>
  );
}
