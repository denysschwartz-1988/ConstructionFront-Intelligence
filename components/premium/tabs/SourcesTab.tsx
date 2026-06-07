"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ProjectRecord, ProjectSourceRecord } from "@/types/database";
import { formatDate, formatMonthYear } from "@/lib/utils";
import { cardStyle, rowLabelStyle, rowStyle, rowValueStyle, sectionLabelStyle, tabRootStyle } from "@/lib/styles";

type SourcesTabProps = {
  project: ProjectRecord;
  sources: ProjectSourceRecord[];
  isAuthenticated: boolean;
};

const sectionLabel: CSSProperties = sectionLabelStyle;

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
        backgroundColor: "#132845",
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: "0 6px 6px 0",
        padding: "10px 12px"
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
        <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>
          {source.sourceTitle}
        </div>
      ) : null}

      {source.summary ? (
        <p
          style={{
            color: "#8b949e",
            fontSize: 12,
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

export default function SourcesTab({
  project,
  sources,
  isAuthenticated
}: SourcesTabProps) {
  const [showAllExternal, setShowAllExternal] = useState(false);

  const cfSources = useMemo(
    () => sortSources(sources.filter((source) => source.sourceType === "CF Article")),
    [sources]
  );
  const externalSources = useMemo(
    () => sortSources(sources.filter((source) => source.sourceType !== "CF Article")),
    [sources]
  );
  const visibleExternalSources = showAllExternal
    ? externalSources
    : externalSources.slice(0, 3);

  return (
    <div style={tabRootStyle}>
      {cfSources.length > 0 ? (
        <section style={cardStyle}>
          <div style={sectionLabelStyle}>CONSTRUCTIONFRONT COVERAGE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cfSources.map((source) => (
              <div
                key={source.sourceId}
                style={{
                  backgroundColor: "#132845",
                  borderLeft: "3px solid #f0a500",
                  borderRadius: "0 6px 6px 0",
                  padding: "10px 12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#8b949e", fontSize: 11 }}>
                    {formatDate(source.publicationDate)}
                  </span>
                  <span
                    style={{
                      backgroundColor: "rgba(240,165,0,0.15)",
                      color: "#f0a500",
                      fontSize: 9,
                      fontWeight: 600,
                      padding: "1px 5px",
                      borderRadius: 3
                    }}
                  >
                    CF Article
                  </span>
                </div>
                <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                  {source.sourceTitle}
                </div>
                {source.milestoneConfirmed ? (
                  <div style={{ color: "#f0a500", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                    {source.milestoneConfirmed}
                  </div>
                ) : null}
                {source.summary ? (
                  <div style={{ color: "#8b949e", fontSize: 12, lineHeight: 1.5, marginBottom: 6 }}>
                    {source.summary}
                  </div>
                ) : null}
                {source.sourceUrl ? (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#f0a500", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                  >
                    Read on ConstructionFront.com {"\u2192"}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <PremiumBlur isAuthenticated={isAuthenticated}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <section style={cardStyle}>
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

          <section style={cardStyle}>
            <div style={sectionLabel}>DATA RECORD</div>
            <div>
              {[
                ["Total Sources", sources.length],
                ["Record Last Updated", formatMonthYear(project.lastUpdated)]
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={rowStyle}
                >
                  <span style={rowLabelStyle}>{label}</span>
                  <span style={rowValueStyle}>
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
