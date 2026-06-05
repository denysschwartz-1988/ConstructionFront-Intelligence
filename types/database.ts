export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectRecord = {
  projectSlug: string;
  projectName: string | null;
  recordType: string | null;
  parentProjectSlug: string | null;
  region: string | null;
  country: string | null;
  stateProvince: string | null;
  cityArea: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: string | null;
  mapAnchorType: string | null;
  sector: string | null;
  subsector: string | null;
  capacityAmount: number | null;
  capacityUnit: string | null;
  capacityDisplay: string | null;
  capacityNotes: string | null;
  projectValueAmount: number | null;
  projectValueCurrency: string | null;
  projectValueScale: string | null;
  projectValueBasis: string | null;
  projectValueNotes: string | null;
  ownerDeveloper: string | null;
  clientAuthority: string | null;
  leadContractor: string | null;
  contractorConfirmed: boolean | string | null;
  projectImageUrl: string | null;
  currentProjectStage: string | null;
  latestMilestone: string | null;
  latestMilestoneSummary: string | null;
  projectSummary: string | null;
  projectDescriptionFull: string | null;
  projectDescription: string | null;
  latestUpdateSummary: string | null;
  latestCfArticleUrl: string | null;
  bdTiming: string | null;
  opportunityCategories: string | null;
  signalCategories: string | null;
  signalTimingStatus: string | null;
  signalTiming: string | null;
  commercialInterface: string | null;
  procurementPageUrl: string | null;
  opportunityNarrative_contractor: string | null;
  opportunityNarrative_supplier: string | null;
  opportunityNarrative_consultant: string | null;
  opportunityNarrative_omProvider: string | null;
  opportunityNarrative_lender: string | null;
  opportunityNarrative_insurer: string | null;
  opportunityNarrative_vendor: string | null;
  opportunityNarrative_legal: string | null;
  opportunityNarrative_developer: string | null;
  potentialOpportunities: string | null;
  targetBuyerTypes: string | null;
  mapEligibilityStatus: string | null;
  mapEligibilityNotes: string | null;
  constructionStartYear: number | null;
  constructionStartQuarter: string | null;
  constructionStartPrecision: string | null;
  constructionStartNotes: string | null;
  constructionCompletionYear: number | null;
  constructionCompletionQuarter: string | null;
  constructionCompletionPrecision: string | null;
  constructionCompletionNotes: string | null;
  operationsStartYear: number | null;
  operationsStartQuarter: string | null;
  operationsStartPrecision: string | null;
  operationsStartNotes: string | null;
  latestUpdateDate: string | null;
  lastUpdated: string | null;
  last_updated?: string | null;
  updatedAt?: string | null;
  otherKeyInfo: string | null;
  dataCompleteness: string | null;
  reviewStatus: string | null;
  sourceNotes: string | null;
};

export type ProjectSourceRecord = {
  sourceId: string;
  projectSlug: string;
  sourceType: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  publicationDate: string | null;
  publisher: string | null;
  milestoneConfirmed: string | null;
  summary: string | null;
  agentConfidence: string | null;
  humanReviewed: boolean | null;
};

export type ProjectMilestoneRecord = {
  milestoneId: string;
  projectSlug: string;
  milestoneType: string | null;
  milestoneSummary: string | null;
  milestoneDate: string | null;
  milestoneYear: number | null;
  milestoneQuarter: string | null;
  sourceUrl: string | null;
};

export type ProjectPartyRecord = {
  partyId: string;
  projectSlug: string;
  partyName: string | null;
  roleCategory: string | null;
  roleDetail: string | null;
  partyRole: string | null;
  partyType: string | null;
  isJVEntity: boolean | string | null;
  confirmedDate: string | null;
  notes: string | null;
  sourceUrl: string | null;
  agentConfidence: string | null;
  humanReviewed: boolean | null;
};

export type Database = {
  public: {
    Tables: {
      projects_master: {
        Row: ProjectRecord;
        Insert: Partial<ProjectRecord>;
        Update: Partial<ProjectRecord>;
        Relationships: [];
      };
      project_sources: {
        Row: ProjectSourceRecord;
        Insert: Partial<ProjectSourceRecord>;
        Update: Partial<ProjectSourceRecord>;
        Relationships: [];
      };
      project_milestones: {
        Row: ProjectMilestoneRecord;
        Insert: Partial<ProjectMilestoneRecord>;
        Update: Partial<ProjectMilestoneRecord>;
        Relationships: [];
      };
      project_parties: {
        Row: ProjectPartyRecord;
        Insert: Partial<ProjectPartyRecord>;
        Update: Partial<ProjectPartyRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
