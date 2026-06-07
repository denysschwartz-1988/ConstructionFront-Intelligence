"use client";

import React, { useMemo } from "react";
import type {
  ProjectRecord,
  ProjectPartyRecord,
  ProjectSourceRecord
} from "@/types/database";
import { cleanCityArea, formatMonthYear } from "@/lib/utils";
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
  backgroundColor: "#0f2240",
  border: "1px solid #1e3a5f",
  borderLeft: "3px solid #f0a500",
  borderRadius: 6,
  padding: "10px 12px"
};

const partyChipStyle: React.CSSProperties = {
  backgroundColor: "transparent",
  border: "1px solid #1e3a5f",
  borderRadius: 4,
  padding: "3px 8px"
};

const jvEntityCardStyle: React.CSSProperties = {
  backgroundColor: "#132845",
  border: "1px solid #1e3a5f",
  borderRadius: 6,
  padding: "10px 12px",
  marginBottom: 6
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

const isMemberMatchedToJv = (
  member: ProjectPartyRecord,
  jv: ProjectPartyRecord
) => {
  const jvName = jv.partyName?.trim().toLowerCase();
  const roleDetail = member.roleDetail?.trim().toLowerCase();

  return Boolean(jvName && roleDetail?.includes(jvName));
};

const hiddenValueLabels = new Set([
  "unknown",
  "n/a",
  "under review",
  "not stated",
  "value not disclosed"
]);

const isMeaningfulValue = (value: React.ReactNode) => {
  if (value === undefined || value === null || value === "") {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized !== "" && !hiddenValueLabels.has(normalized);
  }

  return true;
};

const getOptionalString = (project: ProjectRecord, key: string) => {
  const value = (project as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
};

const getOptionalNumber = (project: ProjectRecord, key: string) => {
  const value = (project as unknown as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
};

const formatCapacity = (project: ProjectRecord) => {
  if (project.capacityAmount == null) {
    return "";
  }

  const primaryUnit = project.capacityUnit?.trim() ?? "";
  const subsector = project.subsector?.toLowerCase() ?? "";
  const primary = [project.capacityAmount, primaryUnit].filter(Boolean).join(" ");

  if (
    primaryUnit.toLowerCase() === "km" &&
    (subsector.includes("transmission") || subsector.includes("grid"))
  ) {
    return `${project.capacityAmount} km`;
  }

  const secondaryAmount = getOptionalNumber(project, "capacityAmountSecondary");
  const secondaryUnit = getOptionalString(project, "capacityUnitSecondary");

  if (secondaryAmount != null && secondaryUnit) {
    return `${primary} / ${secondaryAmount} ${secondaryUnit}`;
  }

  return primary;
};

const formatProjectValue = (project: ProjectRecord) => {
  const currency = project.projectValueCurrency?.trim();
  const scale = project.projectValueScale?.trim();

  if (
    project.projectValueAmount == null ||
    !isMeaningfulValue(currency) ||
    !isMeaningfulValue(scale)
  ) {
    return "";
  }

  return [
    currency,
    project.projectValueAmount,
    scale
  ].join(" ");
};

const formatTargetDate = (
  year: number | null,
  quarter: string | null,
  precision: string | null
) => {
  if (year == null) {
    return "";
  }

  const base = quarter != null && String(quarter).trim() ? `${String(quarter).trim()} ${year}` : String(year);
  return precision != null && String(precision).trim().toLowerCase() === "indicative"
    ? `${base} (indicative)`
    : base;
};

const isContractorStage = (stage?: string | null) =>
  [
    "contract awarded",
    "under construction",
    "construction complete / operational"
  ].includes(stage?.trim().toLowerCase() ?? "");

const isIndicativeDeliveryStage = (stage?: string | null) =>
  ["financing", "procurement", "fid"].includes(stage?.trim().toLowerCase() ?? "");

const FeatureRow = ({
  label,
  value,
  amber
}: {
  label: string;
  value?: React.ReactNode;
  amber?: boolean;
}) => {
  if (!isMeaningfulValue(value)) {
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
    .filter(isMeaningfulValue)
    .join(" / ");
  const ownerDeveloperParty = parties.find(
    (party) => party.roleCategory === "Developer / Owner" && isMeaningfulValue(party.partyName)
  );
  const publicAuthority = parties
    .filter(
      (party) =>
        (party.roleCategory === "Public Authority" ||
          party.roleCategory === "Client / Public Authority") &&
        isMeaningfulValue(party.partyName)
    )
    .map((party) => party.partyName)
    .join(" | ");
  const parentProjectName = getOptionalString(project, "parentProjectName");
  const parentProjectSlug = project.parentProjectSlug?.trim() ?? "";
  const projectValueLabel =
    project.projectValueBasis && isMeaningfulValue(project.projectValueBasis)
      ? project.projectValueBasis
      : "PROJECT VALUE";
  const parentProgrammeLink = isMeaningfulValue(parentProjectSlug) ? (
    <a
      href={`/map?project=${encodeURIComponent(parentProjectSlug)}`}
      style={{ color: "#e6edf3", textDecoration: "none" }}
    >
      {parentProjectName || parentProjectSlug}
    </a>
  ) : null;
  const isProgramme = project.recordType === "Programme";
  const deliveryModel = getOptionalString(project, "deliveryModel");
  const deliveryModelValue =
    deliveryModel && isIndicativeDeliveryStage(project.currentProjectStage)
      ? `${deliveryModel} (indicative)`
      : deliveryModel;

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

  const latestCfArticle = sources.filter((source) => source.sourceType === "CF Article")[0];
  const latestCfArticleUrl = project.latestCfArticleUrl || latestCfArticle?.sourceUrl;

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
                    {groupedParties.map((group) => {
                      const jvEntities = group.parties.filter((party) => isJvEntity(party));
                      const members = group.parties.filter((party) => !isJvEntity(party));

                      return (
                        <div key={group.label} style={partyGroupStyle}>
                          <div
                            style={{
                              color: "#f0a500",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              marginBottom: 8
                            }}
                          >
                            {group.label}
                          </div>
                          {group.jvOnly ? (
                            jvEntities.length > 0 ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {jvEntities.map((jv) => {
                                  const matchedMembers = members.filter((member) =>
                                    isMemberMatchedToJv(member, jv)
                                  );

                                  return (
                                    <div key={jv.partyId} style={jvEntityCardStyle}>
                                      <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                                        {jv.partyName}
                                      </div>
                                      <div style={{ color: "#8b949e", fontSize: 11, marginBottom: 8 }}>
                                        {jv.roleCategory}
                                      </div>
                                      {matchedMembers.length > 0 ? (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                          {matchedMembers.map((member) => (
                                            <div key={member.partyId} style={partyChipStyle}>
                                              <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
                                                {member.partyName}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                })}
                                {members.filter(
                                  (member) =>
                                    !jvEntities.some((jv) => isMemberMatchedToJv(member, jv))
                                ).length > 0 ? (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {members
                                      .filter(
                                        (member) =>
                                          !jvEntities.some((jv) => isMemberMatchedToJv(member, jv))
                                      )
                                      .map((member) => (
                                        <div key={member.partyId} style={partyChipStyle}>
                                          <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
                                            {member.partyName}
                                          </div>
                                          <div style={{ color: "#8b949e", fontSize: 11 }}>
                                            {member.roleDetail}
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : null}
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {members.map((party) => (
                                  <div key={party.partyId} style={partyChipStyle}>
                                    <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
                                      {party.partyName}
                                    </div>
                                    <div style={{ color: "#8b949e", fontSize: 11 }}>
                                      {getMemberLabel(party)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {group.parties.map((party) => (
                                <div key={party.partyId} style={partyChipStyle}>
                                  <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
                                    {party.partyName}
                                  </div>
                                  <div style={{ color: "#8b949e", fontSize: 11 }}>
                                    {party.roleDetail ?? party.partyRole}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div style={cardStyle}>
                <div style={sectionLabelStyle}>
                  {project.recordType === "Programme"
                    ? "PROGRAMME STRUCTURE"
                    : "PROJECT KEY FEATURES"}
                </div>
                <FeatureRow label="PART OF PROGRAMME" value={parentProgrammeLink} />
                <FeatureRow label="OWNER / DEVELOPER" value={ownerDeveloperParty?.partyName} />
                <FeatureRow label="PUBLIC AUTHORITY" value={publicAuthority} />
                <FeatureRow
                  label="MAIN CONTRACTOR"
                  value={!isProgramme && isContractorStage(project.currentProjectStage) ? project.leadContractor : ""}
                />
                <FeatureRow label="SCALE / SIZE" value={formatCapacity(project)} amber />
                <FeatureRow
                  label={projectValueLabel}
                  value={formatProjectValue(project)}
                  amber
                />
                <FeatureRow label="LOCATION" value={location} />
                <FeatureRow label="DELIVERY MODEL" value={!isProgramme ? deliveryModelValue : ""} />
                <FeatureRow
                  label="CONSTRUCTION START"
                  value={formatTargetDate(
                    project.constructionStartYear,
                    project.constructionStartQuarter,
                    project.constructionStartPrecision
                  )}
                />
                <FeatureRow
                  label="COMPLETION TARGET"
                  value={formatTargetDate(
                    project.constructionCompletionYear,
                    project.constructionCompletionQuarter,
                    project.constructionCompletionPrecision
                  )}
                />
                <FeatureRow
                  label="OPERATIONS TARGET"
                  value={formatTargetDate(
                    project.operationsStartYear,
                    project.operationsStartQuarter,
                    project.operationsStartPrecision
                  )}
                />
              </div>
            </div>

            <div style={cardStyle}>
              <div style={sectionLabelStyle}>LATEST INTELLIGENCE</div>
              <div style={{ ...mutedTextStyle, marginBottom: 8 }}>
                Updated: {formatMonthYear(project.lastUpdated)}
              </div>
              <p style={bodyTextStyle}>
                {project.latestUpdateSummary || "No intelligence update available."}
              </p>
              {latestCfArticleUrl ? (
                <a
                  href={latestCfArticleUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: 12,
                    color: "#f0a500",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    border: "1px solid #f0a500",
                    borderRadius: 6,
                    padding: "6px 12px"
                  }}
                >
                  Read on ConstructionFront.com {"\u2192"}
                </a>
              ) : null}
            </div>
          </div>
        </PremiumBlur>
    </div>
  );
}
