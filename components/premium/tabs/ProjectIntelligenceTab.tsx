"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  ProjectMilestoneRecord,
  ProjectRecord,
  ProjectPartyRecord,
  ProjectSourceRecord
} from "@/types/database";
import { cleanCityArea, formatMonthYear, formatProjectValue } from "@/lib/utils";
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
import { supabase } from "@/lib/supabase/client";

type Props = {
  project: ProjectRecord;
  parties: ProjectPartyRecord[];
  milestones: ProjectMilestoneRecord[];
  sources: ProjectSourceRecord[];
  isAuthenticated: boolean;
};

type PartyGroup = {
  label: string;
  roles: string[];
  jvOnly?: boolean;
  showWhen?: boolean;
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

const normalizeRole = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const isJvEntity = (party: ProjectPartyRecord) => {
  return party.isJVEntity === true || party.isJVEntity === "true";
};

const getPartyField = (party: ProjectPartyRecord, key: string) => {
  const value = (party as unknown as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
};

const isJvMember = (party: ProjectPartyRecord) => {
  const value = (party as unknown as Record<string, unknown>).isJVMember;
  return value === true || value === "true";
};

const parentJvName = (party: ProjectPartyRecord) => getPartyField(party, "parentJVName");

const matchesGroup = (party: ProjectPartyRecord, group: PartyGroup) => {
  const roleValues = [
    normalizeRole(party.roleCategory),
    normalizeRole(party.partyRole)
  ];

  return group.roles.some((role) => {
    const normalizedRole = normalizeRole(role);
    return roleValues.some(
      (value) => value === normalizedRole || value.includes(normalizedRole)
    );
  });
};

const hasRoleCategory = (party: ProjectPartyRecord, roles: string[]) =>
  roles.some((role) => party.roleCategory === role);

const mainContractorRoles = [
  "EPC Contractor",
  "EPCC Contractor",
  "EPCM Contractor",
  "Main Contractor",
  "Alliance Contractor",
  "Design and Build Contractor",
  "Balance of Plant Contractor"
];

const technologyRoles = [
  "Technology Supplier",
  "Equipment Supplier",
  "Battery Technology Supplier"
];

const financierRoles = [
  "Financier / Lender",
  "Equity Investor"
];

const advisorRoles = [
  "Legal Advisor",
  "Commercial Advisor",
  "Engineering Consultant",
  "Environmental Consultant",
  "Project Management Consultant"
];

const otherNamedRoles = [
  "Civil Contractor",
  "Grid Operator",
  "O&M Provider",
  "Offtaker / Commercial Counterparty"
];

const getMemberLabel = (party: ProjectPartyRecord) => {
  const roleDetail = party.roleDetail?.trim();
  if (!roleDetail) {
    return party.partyRole ?? party.roleCategory ?? "";
  }

  return roleDetail.split(":")[0]?.trim() || roleDetail;
};

function getShortRoleLabel(roleCategory: string | null): string {
  if (!roleCategory) return "";
  const map: Record<string, string> = {
    "Developer / Owner": "Owner / Developer",
    "Government / Regulator / Public Authority": "Public Authority",
    "Joint Venture / Consortium": "Consortium",
    "Shortlisted Consortium": "Shortlisted Consortium",
    "EPC Contractor": "EPC Contractor",
    "EPCC Contractor": "EPCC Contractor",
    "EPCM Contractor": "EPCM Contractor",
    "Main Contractor": "Main Contractor",
    "Civil Contractor": "Other Contractor",
    "Alliance Contractor": "Alliance Contractor",
    "Design and Build Contractor": "D&B Contractor",
    "Balance of Plant Contractor": "BoP Contractor",
    "Engineering Consultant": "Engineering Consultant",
    "Project Management Consultant": "PMC",
    "Legal Advisor": "Legal Advisor",
    "Commercial Advisor": "Commercial Advisor",
    "Financier / Lender": "Lender",
    "Equity Investor": "Equity Investor",
    "Offtaker / Commercial Counterparty": "Offtaker",
    "Technology Supplier": "Technology Supplier",
    "Equipment Supplier": "Equipment Supplier",
    "Battery Technology Supplier": "Battery Technology",
    "Environmental Consultant": "Environmental Consultant",
    "Grid Operator": "Grid Operator",
    "O&M Provider": "O&M Provider"
  };
  return map[roleCategory] ?? roleCategory;
}

const isMemberMatchedToJv = (
  member: ProjectPartyRecord,
  jv: ProjectPartyRecord
) => {
  const jvName = jv.partyName?.trim().toLowerCase();
  const parentName = parentJvName(member).toLowerCase();
  const roleDetail = member.roleDetail?.trim().toLowerCase();

  return Boolean(jvName && (parentName === jvName || roleDetail?.includes(jvName)));
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

function formatProjectDate(
  year: number | null | undefined,
  precision: string | null | undefined
): string {
  if (!year) return "";
  const indicative = String(precision ?? "").trim().toLowerCase() === "indicative" ? " (indicative)" : "";
  return `${year}${indicative}`;
}

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

const memberChipStyle: React.CSSProperties = {
  backgroundColor: "#0a1628",
  border: "1px solid #1e3a5f",
  borderRadius: 999,
  color: "#e6edf3",
  fontSize: 11,
  fontWeight: 500,
  padding: "3px 8px"
};

const chipLabel = (party: ProjectPartyRecord, fallbackToRoleCategory = false) =>
  getShortRoleLabel(party.roleCategory);

const FlatPartyChip = ({
  party,
  fallbackToRoleCategory
}: {
  party: ProjectPartyRecord;
  fallbackToRoleCategory?: boolean;
}) => (
  <div style={partyChipStyle}>
    <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 500 }}>
      {party.partyName}
    </div>
    <div style={{ color: "#8b949e", fontSize: 11 }}>
      {chipLabel(party, fallbackToRoleCategory)}
    </div>
  </div>
);

const JvEntityCard = ({
  entity,
  members
}: {
  entity: ProjectPartyRecord;
  members: ProjectPartyRecord[];
}) => (
  <div style={jvEntityCardStyle}>
    <div style={{ color: "#f0a500", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
      {entity.partyName}
    </div>
    <div style={{ color: "#8b949e", fontSize: 11, marginBottom: members.length > 0 ? 8 : 0 }}>
      {entity.roleCategory}
    </div>
    {members.length > 0 ? (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {members.map((member) => (
          <span
            key={member.partyId}
            title={getMemberLabel(member)}
            style={memberChipStyle}
          >
            {member.partyName}
          </span>
        ))}
      </div>
    ) : null}
  </div>
);

const PartyGroupBox = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div style={partyGroupStyle}>
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
      {label}
    </div>
    {children}
  </div>
);

const renderPartyGroup = (
  label: string,
  flatParties: ProjectPartyRecord[],
  jvEntities: ProjectPartyRecord[],
  allParties: ProjectPartyRecord[],
  fallbackToRoleCategory = false
) => {
  const hasContent = flatParties.length > 0 || jvEntities.length > 0;
  if (!hasContent) return null;

  return (
    <PartyGroupBox key={label} label={label}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {jvEntities.map((entity) => (
          <JvEntityCard
            key={entity.partyId}
            entity={entity}
            members={allParties.filter((party) => isJvMember(party) && isMemberMatchedToJv(party, entity))}
          />
        ))}
        {flatParties.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {flatParties.map((party) => (
              <FlatPartyChip
                key={party.partyId}
                party={party}
                fallbackToRoleCategory={fallbackToRoleCategory}
              />
            ))}
          </div>
        ) : null}
      </div>
    </PartyGroupBox>
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
  milestones = [],
  sources,
  isAuthenticated
}: Props) {
  const [parentProjectName, setParentProjectName] = useState<string | null>(null);
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
      {parentProjectName ?? parentProjectSlug}
    </a>
  ) : null;
  const isProgramme = project.recordType === "Programme";
  const deliveryModel = getOptionalString(project, "deliveryModel");
  const deliveryModelValue =
    deliveryModel && isIndicativeDeliveryStage(project.currentProjectStage)
      ? `${deliveryModel} (indicative)`
      : deliveryModel;

  const postShortlistStage = milestones.some(
    (milestone) =>
      milestone.milestoneType?.includes("Preferred Bidder") ||
      milestone.milestoneType?.includes("Contract Award")
  );

  const keyPartySections = useMemo(() => {
    const usedPartyIds = new Set<string>();
    const markUsed = (items: ProjectPartyRecord[]) => {
      items.forEach((party) => usedPartyIds.add(party.partyId));
    };
    const markJvWithMembers = (entities: ProjectPartyRecord[]) => {
      markUsed(entities);
      entities.forEach((entity) => {
        markUsed(parties.filter((party) => isJvMember(party) && isMemberMatchedToJv(party, entity)));
      });
    };
    const available = (party: ProjectPartyRecord) => !usedPartyIds.has(party.partyId);

    const primaryGroups: PartyGroup[] = [
      {
        label: "OWNER / DEVELOPER",
        roles: ["Developer / Owner"]
      },
      {
        label: "PUBLIC AUTHORITY / GOVERNMENT",
        roles: ["Government / Regulator / Public Authority"]
      },
      {
        label: "MAIN CONTRACTOR",
        roles: mainContractorRoles,
        showWhen: postShortlistStage
      },
      {
        label: "SHORTLISTED CONSORTIA",
        roles: ["Shortlisted Consortium"],
        jvOnly: true,
        showWhen: !postShortlistStage
      },
      {
        label: "TECHNOLOGY / EQUIPMENT",
        roles: technologyRoles
      }
    ];

    const sections: React.ReactNode[] = [];

    primaryGroups.forEach((group) => {
      if (group.showWhen === false) return;

      const matchingParties = parties.filter((party) => hasRoleCategory(party, group.roles));

      const useJvCards = group.label === "MAIN CONTRACTOR" || group.label === "SHORTLISTED CONSORTIA";
      const jvEntities = useJvCards
        ? matchingParties.filter((party) => isJvEntity(party) && available(party))
        : [];
      const flatParties = matchingParties.filter(
        (party) =>
          !isJvMember(party) &&
          available(party) &&
          (useJvCards ? !isJvEntity(party) && !group.jvOnly : true)
      );

      if (jvEntities.length === 0 && flatParties.length === 0) return;

      markJvWithMembers(jvEntities);
      markUsed(flatParties);
      sections.push(renderPartyGroup(group.label, flatParties, jvEntities, parties));
    });

    const financierParties = parties.filter(
      (party) => hasRoleCategory(party, financierRoles) && !isJvMember(party) && available(party)
    );

    if (financierParties.length > 0) {
      markUsed(financierParties);
      sections.push(renderPartyGroup("FINANCIERS", financierParties, [], parties, true));
    }

    const advisorParties = parties.filter((party) => hasRoleCategory(party, advisorRoles));
    const advisorJvEntities = advisorParties.filter(
      (party) =>
        party.roleCategory === "Project Management Consultant" &&
        isJvEntity(party) &&
        available(party)
    );
    const advisorFlatParties = advisorParties.filter(
      (party) => !isJvEntity(party) && !isJvMember(party) && available(party)
    );

    if (advisorJvEntities.length > 0 || advisorFlatParties.length > 0) {
      markJvWithMembers(advisorJvEntities);
      markUsed(advisorFlatParties);
      sections.push(
        renderPartyGroup(
          "ADVISORS",
          advisorFlatParties,
          advisorJvEntities,
          parties,
          true
        )
      );
    }

    const groupedRoles = [
      ...primaryGroups.flatMap((group) => group.roles),
      ...financierRoles,
      ...advisorRoles,
      ...otherNamedRoles,
      "Shortlisted Consortium"
    ];
    const otherFlatParties = parties.filter(
      (party) =>
        !isJvMember(party) &&
        available(party) &&
        (
          hasRoleCategory(party, otherNamedRoles) ||
          (postShortlistStage && party.roleCategory === "Shortlisted Consortium") ||
          !hasRoleCategory(party, groupedRoles)
        )
    );

    if (otherFlatParties.length > 0) {
      markUsed(otherFlatParties);
      sections.push(
        renderPartyGroup(
          "OTHER NAMED PARTIES",
          otherFlatParties,
          [],
          parties,
          true
        )
      );
    }

    return sections.filter(Boolean);
  }, [milestones, parties, postShortlistStage, project.leadContractor]);

  const latestCfArticle = sources.filter((source) => source.sourceType === "CF Article")[0];
  const latestCfArticleUrl = project.latestCfArticleUrl || latestCfArticle?.sourceUrl;

  useEffect(() => {
    if (project.parentProjectSlug) {
      supabase
        .from("projects_master")
        .select("projectName")
        .eq("projectSlug", project.parentProjectSlug)
        .single()
        .then(({ data }) => {
          if (data?.projectName) {
            setParentProjectName(data.projectName);
          }
        });
    }
  }, [project.parentProjectSlug]);

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
              {keyPartySections.length > 0 ? (
                <div style={cardStyle}>
                  <div style={sectionLabelStyle}>KEY PARTIES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {keyPartySections}
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
                  value={formatProjectValue(
                    project.projectValueAmount,
                    project.projectValueCurrency,
                    project.projectValueScale
                  )}
                  amber
                />
                <FeatureRow label="LOCATION" value={location} />
                <FeatureRow label="DELIVERY MODEL" value={!isProgramme ? deliveryModelValue : ""} />
                <FeatureRow
                  label="CONSTRUCTION START"
                  value={formatProjectDate(
                    project.constructionStartYear,
                    project.constructionStartPrecision
                  )}
                />
                <FeatureRow
                  label="COMPLETION"
                  value={formatProjectDate(
                    project.constructionCompletionYear,
                    project.constructionCompletionPrecision
                  )}
                />
                <FeatureRow
                  label="OPERATIONS"
                  value={formatProjectDate(
                    project.operationsStartYear,
                    project.operationsStartPrecision
                  )}
                />
              </div>
            </div>

              <div style={cardStyle}>
              <div style={sectionLabelStyle}>LATEST INTELLIGENCE</div>
              {project.lastUpdated && (
                <div style={{ ...mutedTextStyle, marginBottom: 8 }}>
                  Last updated: {new Date(project.lastUpdated).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                </div>
              )}
              <p style={bodyTextStyle}>
                {project.latestUpdateSummary || "No intelligence update available."}
              </p>
              {project.latestCfArticleUrl && (
                <a
                  href={project.latestCfArticleUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#f0a500",
                    fontSize: 12,
                    textDecoration: "none",
                    display: "inline-block",
                    marginTop: 6
                  }}
                >
                  Read more {"\u2192"}
                </a>
              )}
            </div>
          </div>
        </PremiumBlur>
    </div>
  );
}
