export interface TaxonomyTopic {
  id: string;
  code: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  curriculumCodes: string[];
  prerequisites: string[]; // Topic IDs
  dependencies: string[]; // Topic IDs that depend on this
  evidenceCriteria: EvidenceCriterion[];
  clusterId?: string;
}

export interface EvidenceCriterion {
  id: string;
  type: "demonstration" | "explanation" | "application" | "analysis" | "creation";
  description: string;
  masteryThreshold: number; // 0-1
  assessmentMethods: string[];
}

export interface TaxonomyDependency {
  from: string; // Topic ID
  to: string; // Topic ID
  type: "prerequisite" | "related" | "extends";
  strength: number; // 0-1
}

export interface Curriculum {
  id: string;
  code: string;
  name: string;
  authority: string;
  jurisdiction: string;
  grades: string[];
  subjects: string[];
  standardCount: number;
}

export interface CurriculumStandard {
  id: string;
  curriculumId: string;
  code: string;
  description: string;
  subject: string;
  grade: string;
  topicIds: string[];
}

export interface TaxonomyCluster {
  id: string;
  name: string;
  description: string;
  topicIds: string[];
  subject: string;
}

export interface TaxonomyGraph {
  topics: Map<string, TaxonomyTopic>;
  dependencies: TaxonomyDependency[];
  clusters: Map<string, TaxonomyCluster>;
  curricula: Map<string, Curriculum>;
  standards: Map<string, CurriculumStandard>;
  subjectIndex: Map<string, string[]>; // subject -> topic IDs
  gradeIndex: Map<string, string[]>; // grade -> topic IDs
}

export interface TaxonomyVerificationInput {
  agentRole: string;
  adapterType: string;
  requiredSkills: string[];
  existingKnowledge?: string[]; // Topic IDs the agent already knows
}

export interface TaxonomyVerificationResult {
  passed: boolean;
  gates: GateResult[];
  failures: string[];
  warnings: string[];
  missingPrerequisites: string[];
  recommendedLearningPath: string[];
}

export interface GateResult {
  gate: number;
  name: string;
  passed: boolean;
  details: string;
  evidence: string[];
}

export interface LearningPathStep {
  topicId: string;
  topicTitle: string;
  reason: string;
  estimatedHours: number;
  evidenceCriteria: EvidenceCriterion[];
}