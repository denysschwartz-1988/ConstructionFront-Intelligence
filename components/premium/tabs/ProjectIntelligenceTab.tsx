"use client";

import React, { useMemo } from "react";
import type {
  ProjectRecord,
  ProjectPartyRecord,
  ProjectSourceRecord
} from "@/types/database";
import { cleanCityArea } from "@/lib/utils";
import {
  bodyTextStyle,
  cardStyle,
  mutedTextStyle,
  rowLabelStyle,
  rowStyle,
  rowValueStyle,
  sectionLabelStyle,
  tabRootStyle
} from "@/lib/styles";

type Props = {
  project: ProjectRecord;
  parties: ProjectPartyRecord[];
  sources: ProjectSourceRecord[];
  isAuthenticated: boolean;
};

type PartyGroup = {
  label: string;
  roles: string[];
  jvOnly?: boolean;
};

const partyGroupStyle: React.CSSProperties = {
  backgroundColor: "#132845",
  border: "1px solid #1e3a5f",
  borderRadius: 6,
  padding: "8px 10px"
};

const partyChipStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #1e3a5f",
  borderRadius: 4,
  padding: "3px 8px"
};

const partyGroups: PartyGroup[] = [
  { label: "OWNER / DEVELOPER", roles: ["Developer / Owner", "Owner / Developer"] },
  { label: "PUBLIC AUTHORITY", roles: ["Public Authority", "Client / Public Authority"] },
  { label: "GOVERNMENT", roles: ["Government"] },
  { label: "DELIVERY CONSORTIUM", roles: ["Joint Venture / Consortium"], jvOnly: true },
  { label: "SHORTLISTED CONSORTIA", roles: ["Shortlisted Consortium"], jvOnly: true },
  {
    label: "MAIN CONTRACTOR",
    roles: ["EPC Contractor", "EPCC Contractor", "Main Contractor"]
  },
  {
    label: "PROJECT MANAGEMENT CONSULTANT",
    roles: ["Project Management Consultant"],
    jvOnly: true
  },
  { label: "LENDER", roles: ["Financier", "Lender", "Financier / Lender"] },
  { label: "EQUITY INVESTOR", roles: ["Equity Investor"] },
  {
    label: "OFFTAKER",
    roles: ["Offtaker", "Commercial Counterparty", "Offtaker / Commercial Counterparty"]
  },
  { label: "OWNER'S ENGINEER", roles: ["Owner's Engineer"] },
  { label: "LEGAL ADVISOR", roles: ["Legal Advisor"] },
  {
    label: "TECHNOLOGY / EQUIPMENT",
    roles: ["Technology Supplier", "Equipment Supplier", "Battery Technology Supplier"]
  },
  { label: "ENVIRONMENTAL CONSULTANT", roles: ["Environmental Consultant"] },
  { label: "GRID OPERATOR", roles: ["Grid Operator"] }
];

const normalizeRole = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const isJvEntity = (party: ProjectPartyRecord) => {
  return party.isJVEntity === true || party.isJVEntity === "true";
};

const matchesGroup = (party: ProjectPartyRecord, group: PartyGroup) => {
  if (group.jvOnly && !isJvEntity(party)) {
    return false;
  }

  const roleValues = [
    normalizeRole(party.roleCategory),
    normalizeRole(party.partyRole),
    normalizeRole(party.roleDetail)
  ];

  return group.roles.some((role) => {
    const normalizedRole = normalizeRole(role);
    return roleValues.some(
      (value) => value === normalizedRole || value.includes(normalizedRole)
    );
  });
};

const getMemberLabel = (party: ProjectPartyRecord) => {
  const roleDetail = party.roleDetail?.trim();
  if (!roleDetail) {
    return party.partyRole ?? party.roleCategory ?? "";
  }

  return roleDetail.split(":")[0]?.trim() || roleDetail;
};

const getProjectValue = (project: ProjectRecord) => {
  if (project.projectValueAmount == null) {
    return "";
  }

  return [
    project.projectValueCurrency?.trim(),
    project.projectValueAmount,
    project.projectValueScale?.trim()
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(" ");
};

function formatDate(dateStr: string | null | undefined): string {
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

const FeatureRow = ({
  label,
  value,
  amber
}: {
  label: string;
  value?: string | number | null;
  amber?: boolean;
}) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div
      style={rowStyle}
    >
      <span
        style={{
          ...rowLabelStyle
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...rowValueStyle,
          color: amber ? "#f0a500" : rowValueStyle.color,
          maxWidth: "60%"
        }}
      >
        {value}
      </span>
    </div>
  );
};

const PremiumBlur = ({
  isAuthenticated,
  children
}: {
  isAuthenticated: boolean;
  children: React.ReactNode;
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

export default function ProjectIntelligenceTab({
  project,
  parties,
  sources,
  isAuthenticated
}: Props) {
  const fullDescription =
    project.projectDescriptionFull || project.projectDescription || "No project description available.";
  const otherKeyInfo = project.otherKeyInfo ?? project.sourceNotes;
  const location = [project.country, project.stateProvince, cleanCityArea(project.cityArea)]
    .filter(Boolean)
    .join(" / ");
  const projectValue = getProjectValue(project);

  const groupedParties = useMemo(
    () =>
      partyGroups
        .map((group) => ({
          ...group,
          parties: parties.filter((party) => matchesGroup(party, group))
        }))
        .filter((group) => group.parties.length > 0),
    [parties]
  );

  const latestCfArticle = sources
    .filter((s) => s.sourceType === "CF Article")
    .sort((a, b) => {
      const da = a.publicationDate ? new Date(a.publicationDate).getTime() : 0;
      const db = b.publicationDate ? new Date(b.publicationDate).getTime() : 0;
      return db - da;
    })[0];

  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  return (
    <div style={tabRootStyle}>
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>PROJECT BRIEF</div>

          <p
            style={{
              ...bodyTextStyle,
              margin: 0,
              marginBottom: otherKeyInfo ? 12 : 0
            }}
          >
            {fullDescription}
          </p>

          {otherKeyInfo ? (
            <>
              <div
                style={{
                  borderTop: "1px solid #1e3a5f",
                  margin: "12px 0"
                }}
              />
              <p
                style={{
                  ...bodyTextStyle,
                  margin: 0
                }}
              >
                {otherKeyInfo}
              </p>
            </>
          ) : null}
        </div>

        <PremiumBlur isAuthenticated={isAuthenticated}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {groupedParties.length > 0 ? (
                <div style={cardStyle}>
                  <div style={sectionLabelStyle}>KEY PARTIES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {groupedParties.map((group) => (
                      <div key={group.label} style={partyGroupStyle}>
                        <div
                          style={{
                            color: "#8b949e",
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            marginBottom: 8
                          }}
                        >
                          {group.label}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {group.parties.map((party) => (
                            <div key={party.partyId} style={partyChipStyle}>
                              <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
                                {party.partyName}
                              </div>
                              <div style={{ color: "#8b949e", fontSize: 11 }}>
                                {group.jvOnly ? getMemberLabel(party) : party.roleDetail ?? party.partyRole}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={cardStyle}>
                <div style={sectionLabelStyle}>
                  {project.recordType === "Programme"
                    ? "PROGRAMME STRUCTURE"
                    : "PROJECT KEY FEATURES"}
                </div>
                <FeatureRow label="OWNER / DEVELOPER" value={project.ownerDeveloper} />
                <FeatureRow label="MAIN CONTRACTOR" value={project.leadContractor} />
                <FeatureRow label="PROJECT VALUE" value={projectValue} amber />
                <FeatureRow label="SCALE / SIZE" value={project.capacityDisplay} amber />
                <FeatureRow label="LOCATION" value={location} />
                <FeatureRow label="SECTOR" value={project.sector} />
                <FeatureRow label="SUBSECTOR" value={project.subsector} />
                <FeatureRow label="CURRENT STAGE" value={project.currentProjectStage} />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={sectionLabelStyle}>LATEST INTELLIGENCE</div>
              <div style={{ ...mutedTextStyle, marginBottom: 8 }}>
                Updated: {formatDate(project.lastUpdated ?? project.latestUpdateDate)}
              </div>
              <div style={bodyTextStyle}>
                {project.latestUpdateSummary}
              </div>
              <div style={{ marginTop: 12 }}>
                {latestCfArticle &&
                latestCfArticle.publicationDate &&
                now - new Date(latestCfArticle.publicationDate).getTime() <= ninetyDays ? (
                  <a
                    href={latestCfArticle.sourceUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#f0a500",
                      color: "#0b1a2d",
                      padding: "8px 12px",
                      borderRadius: 6,
                      textDecoration: "none"
                    }}
                  >
                    Read Detailed Coverage on ConstructionFront.com {"->"}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </PremiumBlur>
    </div>
  );
}
