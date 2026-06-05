"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ProjectRecord, ProjectSourceRecord } from "@/types/database";

type SourcesTabProps = {
  project: ProjectRecord;
  sources: ProjectSourceRecord[];
  isAuthenticated: boolean;
};

const sectionLabel: CSSProperties = {
  color: "#f0a500",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  marginBottom: 8,
  textTransform: "uppercase"
};

const badgeStyle: CSSProperties = {
  borderRadius: 4,
  display: "inline-flex",
  fontSize: 10,
  fontWeight: 600,
  padding: "2px 6px"
};

const borderColors: Record<string, string> = {
  Government: "#1f6feb",
  Company: "#238636",
  "Regulatory Filing": "#8957e5",
  "Project Website": "#0d96a6",
  "Legal Advisor": "#f0a500",
  "Stock Exchange": "#3fb950",
  Other: "#8b949e"
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";

  try {
    if (dateStr.includes("/")) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (Number.isNaN(date.getTime())) return "\u2014";
      return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "\u2014";
    return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return "\u2014";
  }
}

const sortSources = (items: ProjectSourceRecord[]) =>
  [...items].sort((a, b) => {
    const aDate = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
    const bDate = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
    return bDate - aDate;
  });

const SourceCard = ({
  source,
  borderColor,
  isCfArticle
}: {
  source: ProjectSourceRecord;
  borderColor: string;
  isCfArticle?: boolean;
}) => {
  const sourceType = source.sourceType || "Other";

  return (
    <div
      style={{
        backgroundColor: "#1c2128",
        border: "1px solid #30363d",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 8,
        padding: 16
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          flexWrap: "wrap"
        }}
      >
        <span style={{ color: "#8b949e", fontSize: 11 }}>
          {formatDate(source.publicationDate)}
        </span>
        <span
          style={{
            ...badgeStyle,
            backgroundColor: isCfArticle ? "rgba(240,165,0,0.12)" : `${borderColor}22`,
            border: `1px solid ${isCfArticle ? "#f0a500" : borderColor}`,
            color: isCfArticle ? "#f0a500" : borderColor
          }}
        >
          {sourceType}
        </span>
        {!isCfArticle && source.publisher ? (
          <span style={{ color: "#8b949e", fontSize: 11 }}>{source.publisher}</span>
        ) : null}
        {isCfArticle && source.milestoneConfirmed ? (
          <span style={{ color: "#f0a500", fontSize: 11, fontWeight: 600 }}>
            {source.milestoneConfirmed}
          </span>
        ) : null}
      </div>

      {!isCfArticle && source.sourceTitle ? (
        <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          {source.sourceTitle}
        </div>
      ) : null}

      {source.summary ? (
        <p
          style={{
            color: isCfArticle ? "#e6edf3" : "#8b949e",
            fontSize: 13,
            lineHeight: 1.5,
            margin: 0
          }}
        >
          {source.summary}
        </p>
      ) : null}

      {source.sourceUrl ? (
        <a
          href={source.sourceUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#f0a500",
            display: "inline-flex",
            fontSize: 12,
            fontWeight: 600,
            marginTop: 10,
            textDecoration: "none"
          }}
        >
          {isCfArticle ? "Read on ConstructionFront.com ->" : "View source ->"}
        </a>
      ) : null}
    </div>
  );
};

const ExpandButton = ({
  count,
  isExpanded,
  onClick
}: {
  count: number;
  isExpanded: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      alignSelf: "flex-start",
      background: "transparent",
      border: "none",
      color: "#f0a500",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      padding: 0
    }}
  >
    {isExpanded ? "Show less" : `Show ${count} more`}
  </button>
);

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

export default function SourcesTab({
  project,
  sources,
  isAuthenticated
}: SourcesTabProps) {
  const [showAllCf, setShowAllCf] = useState(false);
  const [showAllExternal, setShowAllExternal] = useState(false);

  const cfSources = useMemo(
    () => sortSources(sources.filter((source) => source.sourceType === "CF Article")),
    [sources]
  );
  const externalSources = useMemo(
    () => sortSources(sources.filter((source) => source.sourceType !== "CF Article")),
    [sources]
  );
  const firstCfSource = cfSources[0];
  const remainingCfSources = cfSources.slice(1);
  const visibleRemainingCfSources = showAllCf
    ? remainingCfSources
    : remainingCfSources.slice(0, 3);
  const visibleExternalSources = showAllExternal
    ? externalSources
    : externalSources.slice(0, 3);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <section>
        <div style={sectionLabel}>CONSTRUCTIONFRONT COVERAGE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {firstCfSource ? (
            <SourceCard
              source={firstCfSource}
              borderColor="#f0a500"
              isCfArticle
            />
          ) : (
            <p style={{ color: "#8b949e", margin: 0 }}>
              No ConstructionFront coverage recorded yet.
            </p>
          )}
        </div>
      </section>

      <PremiumBlur isAuthenticated={isAuthenticated}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <section>
            <div style={sectionLabel}>MORE CONSTRUCTIONFRONT COVERAGE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visibleRemainingCfSources.length > 0 ? (
                visibleRemainingCfSources.map((source) => (
                  <SourceCard
                    key={source.sourceId}
                    source={source}
                    borderColor="#f0a500"
                    isCfArticle
                  />
                ))
              ) : (
                <p style={{ color: "#8b949e", margin: 0 }}>
                  No additional ConstructionFront coverage recorded yet.
                </p>
              )}
              {remainingCfSources.length > 3 ? (
                <ExpandButton
                  count={remainingCfSources.length - 3}
                  isExpanded={showAllCf}
                  onClick={() => setShowAllCf((current) => !current)}
                />
              ) : null}
            </div>
          </section>

          <section>
            <div style={sectionLabel}>EXTERNAL SOURCES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visibleExternalSources.length > 0 ? (
                visibleExternalSources.map((source) => {
                  const sourceType = source.sourceType || "Other";
                  return (
                    <SourceCard
                      key={source.sourceId}
                      source={source}
                      borderColor={borderColors[sourceType] ?? borderColors.Other}
                    />
                  );
                })
              ) : (
                <p style={{ color: "#8b949e", margin: 0 }}>
                  No external sources recorded yet.
                </p>
              )}
              {externalSources.length > 3 ? (
                <ExpandButton
                  count={externalSources.length - 3}
                  isExpanded={showAllExternal}
                  onClick={() => setShowAllExternal((current) => !current)}
                />
              ) : null}
            </div>
          </section>

          <section>
            <div style={sectionLabel}>DATA RECORD</div>
            <div
              style={{
                backgroundColor: "#1c2128",
                border: "1px solid #30363d",
                borderRadius: 8,
                padding: "8px 16px"
              }}
            >
              {[
                ["Total Sources", sources.length],
                ["Last Updated", formatMonthYear(project.lastUpdated)],
                ["Data Completeness", project.dataCompleteness || "-"]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid #21262d",
                    padding: "8px 0"
                  }}
                >
                  <span style={{ color: "#8b949e", fontSize: 12 }}>{label}</span>
                  <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PremiumBlur>
    </div>
  );
}
