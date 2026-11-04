import { TaxonomyVerificationInput, TaxonomyVerificationResult, GateResult, LearningPathStep } from "../types";
import { getTaxonomyTraversal, getTaxonomyGraph, initializeTaxonomy } from "../graph";


export async function verifyTaxonomyGate(input: TaxonomyVerificationInput): Promise<TaxonomyVerificationResult> {
  // Ensure taxonomy is initialized
  await initializeTaxonomy();

  const traversal = getTaxonomyTraversal();
  const graph = getTaxonomyGraph();

  const failures: string[] = [];
  const warnings: string[] = [];
  const gates: GateResult[] = [];

  // Gate 1: Taxonomy Load
  const gate1 = verifyGate1();
  gates.push(gate1);
  if (!gate1.passed) failures.push(gate1.details);

  // Gate 2: Prerequisite Trace
  const gate2 = await verifyGate2(input);
  gates.push(gate2);
  if (!gate2.passed) failures.push(...gate2.failures);

  // Gate 3: Gap Analysis
  const gate3 = await verifyGate3(input);
  gates.push(gate3);
  if (!gate3.passed) failures.push(...gate3.failures);

  // Gate 4: Ordered Answer Construction
  const gate4 = verifyGate4(input);
  gates.push(gate4);
  if (!gate4.passed) failures.push(gate4.details);

  // Gate 5: Validation Check
  const gate5 = verifyGate5(input);
  gates.push(gate5);
  if (!gate5.passed) failures.push(gate5.details);

  // Build learning path for missing prerequisites
  const missingPrereqs = collectMissingPrerequisites(input);
  const learningPath = traversal.findLearningPath(missingPrereqs, new Set());

  return {
    passed: failures.length === 0,
    gates,
    failures,
    warnings,
    missingPrerequisites: missingPrereqs,
    recommendedLearningPath: learningPath.map(step => step.topicId),
  };
}

function verifyGate1(): GateResult {
  const graph = getTaxonomyGraph();
  const topicCount = graph.topics.size;
  const depCount = graph.dependencies.length;
  const curriculumCount = graph.curricula.size;

  const passed = topicCount >= 1800 && depCount >= 3900 && curriculumCount >= 8;

  return {
    gate: 1,
    name: "Taxonomy Load",
    passed,
    details: passed
      ? `Loaded ${topicCount} topics, ${depCount} dependencies, ${curriculumCount} curricula`
      : `Insufficient data: ${topicCount} topics, ${depCount} deps, ${curriculumCount} curricula`,
    evidence: [`topics: ${topicCount}`, `dependencies: ${depCount}`, `curricula: ${curriculumCount}`],
  };
}

async function verifyGate2(input: TaxonomyVerificationInput): Promise<GateResult> {
  const traversal = getTaxonomyTraversal();
  const requiredTopics = getRequiredTopicsForRole(input.agentRole);
  const missing: string[] = [];

  for (const topicId of requiredTopics) {
    const prereqs = traversal.getPrerequisites(topicId);
    const missingPrereqs = [...prereqs].filter(id => !input.existingKnowledge?.includes(id));

    if (missingPrereqs.length > 0) {
      missing.push(...missingPrereqs);
    }
  }

  const uniqueMissing = [...new Set(missing)];
  const passed = uniqueMissing.length === 0;

  return {
    gate: 2,
    name: "Prerequisite Trace",
    passed,
    details: passed
      ? "All prerequisites satisfied"
      : `Missing ${uniqueMissing.length} prerequisites: ${uniqueMissing.slice(0, 10).join(", ")}${uniqueMissing.length > 10 ? "..." : ""}`,
    evidence: [`requiredTopics: ${requiredTopics.length}`, `missingPrereqs: ${uniqueMissing.length}`],
    failures: uniqueMissing,
  };
}

async function verifyGate3(input: TaxonomyVerificationInput): Promise<GateResult> {
  const graph = getTaxonomyGraph();
  const gaps: string[] = [];

  // Check if agent has knowledge for required skills
  const requiredSkills = input.requiredSkills;
  for (const skill of requiredSkills) {
    const topicIds = SKILL_TO_TOPICS[skill] || [];
    const hasKnowledge = topicIds.some(id => input.existingKnowledge?.includes(id));

    if (!hasKnowledge && topicIds.length > 0) {
      gaps.push(`Skill "${skill}" requires knowledge of: ${topicIds.join(", ")}`);
    }
  }

  const passed = gaps.length === 0;

  return {
    gate: 3,
    name: "Gap Analysis",
    passed,
    details: passed
      ? "No knowledge gaps detected"
      : `Knowledge gaps: ${gaps.join("; ")}`,
    evidence: [`requiredSkills: ${input.requiredSkills.length}`, `gaps: ${gaps.length}`],
    failures: gaps,
  };
}

function verifyGate4(input: TaxonomyVerificationInput): GateResult {
  // This gate validates that the agent can construct ordered answers
  // In practice, this would be tested by evaluating sample outputs
  // For now, we check if the agent has the foundational topics for ordered reasoning

  const foundationalTopics = [
    "logic_basic_reasoning",
    "evidence_evaluation",
    "structured_argumentation",
    "citation_methods",
  ];

  const missing = foundationalTopics.filter(id => !input.existingKnowledge?.includes(id));
  const passed = missing.length === 0;

  return {
    gate: 4,
    name: "Ordered Answer Construction",
    passed,
    details: passed
      ? "Foundational reasoning topics present"
      : `Missing foundational topics: ${missing.join(", ")}`,
    evidence: [`foundationalTopics: ${foundationalTopics.length}`, `missing: ${missing.length}`],
    failures: missing,
  };
}

function verifyGate5(input: TaxonomyVerificationInput): GateResult {
  // This gate validates self-verification capability
  const verificationTopics = [
    "self_verification_methods",
    "evidence_validation",
    "alternative_consideration",
    "uncertainty_quantification",
  ];

  const missing = verificationTopics.filter(id => !input.existingKnowledge?.includes(id));
  const passed = missing.length === 0;

  return {
    gate: 5,
    name: "Validation Check",
    passed,
    details: passed
      ? "Self-verification capabilities present"
      : `Missing verification topics: ${missing.join(", ")}`,
    evidence: [`verificationTopics: ${verificationTopics.length}`, `missing: ${missing.length}`],
    failures: missing,
  };
}

function getRequiredTopicsForRole(role: string): string[] {
  const skills = ROLE_SKILLS_MAP[role] || ROLE_SKILLS_MAP.default;
  const topics = new Set<string>();

  for (const skill of skills) {
    const topicIds = SKILL_TO_TOPICS[skill] || [];
    for (const id of topicIds) {
      topics.add(id);
    }
  }

  return Array.from(topics);
}

function collectMissingPrerequisites(input: TaxonomyVerificationInput): string[] {
  const traversal = getTaxonomyTraversal();
  const requiredTopics = getRequiredTopicsForRole(input.agentRole);
  const missing = new Set<string>();

  for (const topicId of requiredTopics) {
    const prereqs = traversal.getPrerequisites(topicId);
    for (const prereq of prereqs) {
      if (!input.existingKnowledge?.includes(prereq)) {
        missing.add(prereq);
      }
    }
  }

  return Array.from(missing);
}

// Role to skills mapping
export const ROLE_SKILLS_MAP: Record<string, string[]> = {
  engineer: [
    "code-review", "testing", "debugging", "git-workflow",
    "system-design", "api-design", "database-design", "performance-optimization",
  ],
  researcher: [
    "web-search", "source-verification", "synthesis", "citation",
    "literature-review", "hypothesis-testing", "data-collection", "statistical-analysis",
  ],
  analyst: [
    "data-analysis", "modeling", "visualization", "reporting",
    "sql", "statistics", "forecasting", "business-intelligence",
  ],
  manager: [
    "planning", "delegation", "review", "reporting",
    "team-leadership", "project-management", "stakeholder-communication", "resource-allocation",
  ],
  finance: [
    "financial-modeling", "dscr-calculation", "noi-analysis", "compliance",
    "valuation", "risk-assessment", "regulatory-reporting", "audit-preparation",
  ],
  legal: [
    "contract-review", "compliance-check", "risk-assessment",
    "regulatory-research", "due-diligence", "litigation-support", "ip-management",
  ],
  security: [
    "threat-modeling", "vulnerability-assessment", "incident-response",
    "penetration-testing", "security-auditing", "compliance-auditing", "encryption",
  ],
  marketing: [
    "content-creation", "seo", "analytics", "campaign-management",
    "brand-strategy", "social-media", "email-marketing", "conversion-optimization",
  ],
  support: [
    "ticket-triage", "troubleshooting", "documentation", "escalation",
    "customer-communication", "root-cause-analysis", "knowledge-base", "sla-management",
  ],
  devops: [
    "infrastructure", "ci-cd", "monitoring", "incident-response",
    "container-orchestration", "cloud-architecture", "automation", "security-hardening",
  ],
  default: [
    "communication", "task-management", "documentation",
    "time-management", "problem-solving", "learning-agility",
  ],
};

// Skill to taxonomy topics mapping
export const SKILL_TO_TOPICS: Record<string, string[]> = {
  "code-review": ["code_quality_standards", "review_processes", "security_review", "performance_review"],
  "testing": ["unit_testing", "integration_testing", "test_driven_development", "test_coverage"],
  "debugging": ["debugging_methodologies", "root_cause_analysis", "logging", "profiling"],
  "git-workflow": ["version_control", "branching_strategies", "merge_strategies", "conflict_resolution"],
  "system-design": ["architecture_patterns", "scalability", "reliability", "tradeoff_analysis"],
  "api-design": ["rest_principles", "graphql", "versioning", "documentation"],
  "database-design": ["normalization", "indexing", "query_optimization", "migrations"],
  "performance-optimization": ["profiling", "caching", "load_testing", "bottleneck_identification"],
  "web-search": ["search_operators", "source_evaluation", "fact_checking", "bias_detection"],
  "source-verification": ["primary_sources", "credibility_assessment", "cross_referencing", "citation_standards"],
  "synthesis": ["information_synthesis", "pattern_recognition", "gap_analysis", "narrative_construction"],
  "citation": ["citation_styles", "reference_management", "plagiarism_avoidance", "attribution"],
  "literature-review": ["systematic_review", "meta_analysis", "gap_identification", "research_questions"],
  "hypothesis-testing": ["experimental_design", "statistical_significance", "p_values", "confidence_intervals"],
  "data-collection": ["survey_design", "sampling_methods", "data_quality", "ethics"],
  "statistical-analysis": ["descriptive_stats", "inferential_stats", "regression", "visualization"],
  "data-analysis": ["exploratory_analysis", "data_cleaning", "feature_engineering", "anomaly_detection"],
  "modeling": ["predictive_modeling", "model_selection", "validation", "interpretation"],
  "visualization": ["chart_types", "dashboard_design", "storytelling", "accessibility"],
  "reporting": ["executive_summaries", "technical_reports", "stakeholder_communication", "actionable_insights"],
  "sql": ["query_optimization", "joins", "window_functions", "ctes"],
  "statistics": ["probability", "distributions", "hypothesis_testing", "bayesian_inference"],
  "forecasting": ["time_series", "trend_analysis", "seasonality", "scenario_planning"],
  "business-intelligence": ["kpi_design", "dashboarding", "data_warehousing", "self_service_analytics"],
  "planning": ["strategic_planning", "roadmapping", "prioritization", "resource_planning"],
  "delegation": ["task_decomposition", "authority_assignment", "accountability", "follow_up"],
  "review": ["code_review", "design_review", "performance_review", "feedback_delivery"],
  "team-leadership": ["coaching", "career_development", "conflict_resolution", "team_dynamics"],
  "project-management": ["agile_methodologies", "risk_management", "stakeholder_management", "delivery_tracking"],
  "stakeholder-communication": ["expectation_management", "negotiation", "influence", "presentation"],
  "resource-allocation": ["capacity_planning", "budget_management", "hiring", "vendor_management"],
  "financial-modeling": ["dcf", "comparable_analysis", "precedent_transactions", "sensitivity_analysis"],
  "dscr-calculation": ["debt_service_coverage", "cash_flow_analysis", "covenant_modeling", "stress_testing"],
  "noi-analysis": ["net_operating_income", "cap_rate", "expense_analysis", "revenue_optimization"],
  "compliance": ["regulatory_frameworks", "reporting_requirements", "audit_preparation", "policy_implementation"],
  "valuation": ["enterprise_value", "equity_value", "multiples", "scenario_analysis"],
  "risk-assessment": ["risk_identification", "quantification", "mitigation", "monitoring"],
  "regulatory-reporting": ["sec_filings", "basel_iii", "ifrs", "gaap"],
  "audit-preparation": ["audit_planning", "evidence_collection", "control_testing", "findings_management"],
  "contract-review": ["contract_law", "clause_analysis", "negotiation", "risk_allocation"],
  "compliance-check": ["regulatory_mapping", "gap_analysis", "remediation_tracking", "policy_alignment"],
  "regulatory-research": ["legislative_tracking", "case_law", "regulatory_guidance", "industry_standards"],
  "due-diligence": ["data_room_management", "document_review", "red_flag_identification", "reporting"],
  "litigation-support": ["e_discovery", "expert_witness", "document_review", "case_strategy"],
  "ip-management": ["patent_strategy", "trademark_protection", "trade_secrets", "licensing"],
  "threat-modeling": ["stride", "attack_trees", "risk_scoring", "mitigation_planning"],
  "vulnerability-assessment": ["scanning", "penetration_testing", "risk_prioritization", "remediation_tracking"],
  "incident-response": ["detection", "containment", "eradication", "recovery", "postmortem"],
  "penetration-testing": ["reconnaissance", "exploitation", "privilege_escalation", "reporting"],
  "security-auditing": ["frameworks", "control_testing", "evidence_collection", "reporting"],
  "compliance-auditing": ["soc2", "iso27001", "pci_dss", "hipaa"],
  "encryption": ["symmetric", "asymmetric", "key_management", "protocols"],
  "content-creation": ["copywriting", "storytelling", "brand_voice", "multimedia"],
  "seo": ["keyword_research", "on_page", "technical_seo", "link_building"],
  "analytics": ["ga4", "event_tracking", "funnel_analysis", "attribution"],
  "campaign-management": ["planning", "execution", "optimization", "roi_measurement"],
  "brand-strategy": ["positioning", "identity", "guidelines", "evolution"],
  "social-media": ["platform_strategy", "community_management", "paid_social", "influencer_marketing"],
  "email-marketing": ["segmentation", "automation", "deliverability", "testing"],
  "conversion-optimization": ["a_b_testing", "user_research", "ux_writing", "personalization"],
  "ticket-triage": ["prioritization", "categorization", "routing", "sla_management"],
  "troubleshooting": ["root_cause_analysis", "reproduction", "workarounds", "escalation"],
  "documentation": ["technical_writing", "knowledge_base", "runbooks", "api_docs"],
  "escalation": ["criteria", "communication", "stakeholder_management", "postmortem"],
  "customer-communication": ["empathy", "active_listening", "de-escalation", "expectation_management"],
  "root-cause-analysis": ["5_whys", "fishbone", "fault_tree", "timeline_analysis"],
  "knowledge-base": ["content_strategy", "information_architecture", "search_optimization", "maintenance"],
  "sla-management": ["metrics", "monitoring", "reporting", "continuous_improvement"],
  "infrastructure": ["iac", "cloud_providers", "networking", "security_groups"],
  "ci-cd": ["pipeline_design", "automated_testing", "deployment_strategies", "rollback"],
  "monitoring": ["metrics", "logging", "alerting", "dashboards"],
  "container-orchestration": ["kubernetes", "docker", "service_mesh", "scaling"],
  "cloud-architecture": ["multi_cloud", "serverless", "event_driven", "cost_optimization"],
  "automation": ["scripting", "configuration_management", "policy_as_code", "drift_detection"],
  "security-hardening": ["least_privilege", "encryption", "audit_logging", "compliance"],
  "communication": ["active_listening", "clarity", "empathy", "feedback"],
  "task-management": ["prioritization", "time_blocking", "delegation", "tracking"],
  "time-management": ["prioritization", "focus", "boundaries", "energy_management"],
  "problem-solving": ["frameworks", "creative_thinking", "decision_making", "bias_awareness"],
  "learning-agility": ["growth_mindset", "feedback_seeking", "experimentation", "reflection"],
};