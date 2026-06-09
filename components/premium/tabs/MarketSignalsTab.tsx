"use client";

import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ProjectRecord } from "@/types/database";
import { bodyTextStyle, cardStyle, mutedTextStyle, rowLabelStyle, sectionLabelStyle, tabRootStyle } from "@/lib/styles";

type MarketSignalsTabProps = {
  project: ProjectRecord;
  isAuthenticated: boolean;
};

const sectionLabel: CSSProperties = sectionLabelStyle;
const subsectionLabel: CSSProperties = rowLabelStyle;

const getTimingColor = (status?: string | null) => {
  const normalizedStatus = status?.trim();

  if (normalizedStatus === "Active") {
    return "#3fb950";
  }

  if (normalizedStatus === "Near-Term") {
    return "#f0a500";
  }

  if (
    normalizedStatus === "Early Watch" ||
    normalizedStatus === "Monitor" ||
    normalizedStatus === "Early Watch / Monitor"
  ) {
    return "#8b949e";
  }

  if (normalizedStatus === "Closed") {
    return "#6e7681";
  }

  return "#8b949e";
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
          backgroundColor: "rgba(10,22,40,0.55)",
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
              color: "#0a1628",
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
              border: "1px solid #1e3a5f",
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

export default function MarketSignalsTab({
  project,
  isAuthenticated
}: MarketSignalsTabProps) {
  const [lens, setLens] = useState("contractor");
  const signalCategories = (project.signalCategories ?? "")
    .split("|")
    .map((category) => category.trim())
    .filter(Boolean);
  const timingStatus = project.signalTimingStatus?.trim();
  const timingColor = getTimingColor(timingStatus);
  const narrativeMap: Record<string, string> = {
    contractor: project.opportunityNarrative_contractor ?? "",
    supplier: project.opportunityNarrative_supplier ?? "",
    consultant: project.opportunityNarrative_consultant ?? "",
    omProvider: project.opportunityNarrative_omProvider ?? "",
    lender: project.opportunityNarrative_lender ?? "",
    insurer: project.opportunityNarrative_insurer ?? "",
    vendor: project.opportunityNarrative_vendor ?? "",
    legal: project.opportunityNarrative_legal ?? "",
    developer: project.opportunityNarrative_developer ?? ""
  };
  const narrative = narrativeMap[lens]?.trim();

  return (
    <div style={tabRootStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "35% 65%", gap: 12 }}>
        <div style={cardStyle}>
          <div style={sectionLabel}>STAKEHOLDER LENS</div>
          <div style={{ marginBottom: 16 }}>
            <select
              value={lens}
              onChange={(event) => setLens(event.target.value)}
              style={{
                backgroundColor: "#0f2240",
                border: "1px solid #1e3a5f",
                color: "#e6edf3",
                fontSize: 13,
                borderRadius: 6,
                padding: "6px 10px",
                width: 220
              }}
            >
              <option value="contractor">Contractor</option>
              <option value="supplier">Supplier</option>
              <option value="consultant">Consultant</option>
              <option value="omProvider">O&amp;M Provider</option>
              <option value="lender">Lender</option>
              <option value="insurer">Insurer</option>
              <option value="vendor">Vendor</option>
              <option value="legal">Legal</option>
              <option value="developer">Developer</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                color: "#8b949e",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6
              }}
            >
              Signal Status
            </div>
            {timingStatus ? (
              <span
                style={{
                  display: "inline-flex",
                  backgroundColor: `${timingColor}22`,
                  border: `1px solid ${timingColor}`,
                  color: timingColor,
                  borderRadius: 4,
                  padding: "2px 7px",
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                {timingStatus}
              </span>
            ) : (
              <p style={{ color: "#8b949e", margin: 0 }}>No signal status recorded.</p>
            )}
          </div>

          <div>
            <div
              style={{
                color: "#8b949e",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 6
              }}
            >
              Signal Timing
            </div>
            <div style={{ color: "#f0a500", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              {project.signalTimingStatus}
            </div>
            <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.6 }}>
              {project.signalTiming}
            </div>
          </div>
        </div>

        <PremiumBlur isAuthenticated={isAuthenticated}>
          <div style={cardStyle}>
            <div style={sectionLabel}>COMMERCIAL SIGNALS &amp; INTELLIGENCE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {signalCategories.map((category) => (
                <span
                  key={category}
                  style={{
                    backgroundColor: "rgba(240,165,0,0.1)",
                    border: "1px solid rgba(240,165,0,0.3)",
                    color: "#f0a500",
                    borderRadius: 4,
                    padding: "3px 8px",
                    fontSize: 11
                  }}
                >
                  {category}
                </span>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #1e3a5f", marginBottom: 12 }} />

            <div style={{ color: "#e6edf3", fontSize: 13, lineHeight: 1.7 }}>
              {narrative ? (
                narrative
              ) : (
                <span style={{ color: "#8b949e" }}>
                  No intelligence available for this stakeholder lens.
                </span>
              )}
            </div>
          </div>
        </PremiumBlur>
      </div>
    </div>
  );
}
