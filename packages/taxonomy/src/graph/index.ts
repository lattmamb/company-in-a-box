import { TaxonomyGraph, TaxonomyTopic, TaxonomyDependency, TaxonomyCluster, Curriculum, CurriculumStandard, LearningPathStep } from "../types";

export class TaxonomyGraphBuilder {
  private graph: TaxonomyGraph;

  constructor() {
    this.graph = {
      topics: new Map(),
      dependencies: [],
      clusters: new Map(),
      curricula: new Map(),
      standards: new Map(),
      subjectIndex: new Map(),
      gradeIndex: new Map(),
    };
  }

  addTopic(topic: TaxonomyTopic): this {
    this.graph.topics.set(topic.id, topic);

    // Index by subject
    const subjectTopics = this.graph.subjectIndex.get(topic.subject) || [];
    subjectTopics.push(topic.id);
    this.graph.subjectIndex.set(topic.subject, subjectTopics);

    // Index by grade
    const gradeTopics = this.graph.gradeIndex.get(topic.gradeLevel) || [];
    gradeTopics.push(topic.id);
    this.graph.gradeIndex.set(topic.gradeLevel, gradeTopics);

    return this;
  }

  addDependency(dep: TaxonomyDependency): this {
    this.graph.dependencies.push(dep);
    return this;
  }

  addCluster(cluster: TaxonomyCluster): this {
    this.graph.clusters.set(cluster.id, cluster);
    return this;
  }

  addCurriculum(curriculum: Curriculum): this {
    this.graph.curricula.set(curriculum.id, curriculum);
    return this;
  }

  addStandard(standard: CurriculumStandard): this {
    this.graph.standards.set(standard.id, standard);
    return this;
  }

  build(): TaxonomyGraph {
    return this.graph;
  }
}

export class TaxonomyGraphTraversal {
  constructor(private graph: TaxonomyGraph) {}

  /**
   * Get all prerequisites for a topic (transitive closure)
   */
  getPrerequisites(topicId: string): Set<string> {
    const prereqs = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const topic = this.graph.topics.get(id);
      if (!topic) return;

      for (const prereqId of topic.prerequisites) {
        prereqs.add(prereqId);
        traverse(prereqId);
      }
    };

    traverse(topicId);
    return prereqs;
  }

  /**
   * Get all dependents for a topic (transitive closure)
   */
  getDependents(topicId: string): Set<string> {
    const dependents = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const topic = this.graph.topics.get(id);
      if (!topic) return;

      for (const depId of topic.dependencies) {
        dependents.add(depId);
        traverse(depId);
      }
    };

    traverse(topicId);
    return dependents;
  }

  /**
   * Find learning path from current knowledge to target skills
   */
  findLearningPath(targetTopicIds: string[], knownTopicIds: Set<string> = new Set()): LearningPathStep[] {
    const allPrereqs = new Set<string>();

    for (const targetId of targetTopicIds) {
      const prereqs = this.getPrerequisites(targetId);
      for (const prereq of prereqs) {
        allPrereqs.add(prereq);
      }
    }

    // Remove already known topics
    const missing = [...allPrereqs].filter(id => !knownTopicIds.has(id));

    // Topological sort by dependency depth
    const sorted = this.topologicalSort(missing);

    return sorted.map(topicId => {
      const topic = this.graph.topics.get(topicId)!;
      return {
        topicId: topic.id,
        topicTitle: topic.title,
        reason: `Prerequisite for ${targetTopicIds.map(t => this.graph.topics.get(t)?.title).join(", ")}`,
        estimatedHours: this.estimateHours(topic),
        evidenceCriteria: topic.evidenceCriteria,
      };
    });
  }

  private topologicalSort(topicIds: string[]): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (id: string) => {
      if (temp.has(id)) return; // Cycle detected, skip
      if (visited.has(id)) return;

      temp.add(id);
      const topic = this.graph.topics.get(id);
      if (topic) {
        for (const prereq of topic.prerequisites) {
          if (this.graph.topics.has(prereq)) {
            visit(prereq);
          }
        }
      }
      temp.delete(id);
      visited.add(id);
      result.push(id);
    }

    for (const id of topicIds) {
      visit(id);
    }

    return result;
  }

  private estimateHours(topic: TaxonomyTopic): number {
    // Rough estimation based on evidence criteria count and complexity
    const baseHours = topic.evidenceCriteria.length * 2;
    const complexityMultiplier = topic.prerequisites.length > 3 ? 1.5 : 1;
    return Math.round(baseHours * complexityMultiplier);
  }

  /**
   * Check if a set of topics covers all prerequisites for a target
   */
  coversPrerequisites(knownTopicIds: Set<string>, targetTopicIds: string[]): boolean {
    for (const targetId of targetTopicIds) {
      const prereqs = this.getPrerequisites(targetId);
      for (const prereq of prereqs) {
        if (!knownTopicIds.has(prereq)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Get topics by subject
   */
  getTopicsBySubject(subject: string): TaxonomyTopic[] {
    const ids = this.graph.subjectIndex.get(subject) || [];
    return ids.map(id => this.graph.topics.get(id)!).filter(Boolean);
  }

  /**
   * Get topics by grade level
   */
  getTopicsByGrade(grade: string): TaxonomyTopic[] {
    const ids = this.graph.gradeIndex.get(grade) || [];
    return ids.map(id => this.graph.topics.get(id)!).filter(Boolean);
  }

  /**
   * Get cluster by ID
   */
  getCluster(clusterId: string): TaxonomyCluster | undefined {
    return this.graph.clusters.get(clusterId);
  }

  /**
   * Get curriculum by ID
   */
  getCurriculum(curriculumId: string): Curriculum | undefined {
    return this.graph.curricula.get(curriculumId);
  }

  /**
   * Get standards for a curriculum
   */
  getStandardsForCurriculum(curriculumId: string): CurriculumStandard[] {
    const standards: CurriculumStandard[] = [];
    for (const standard of this.graph.standards.values()) {
      if (standard.curriculumId === curriculumId) {
        standards.push(standard);
      }
    }
    return standards;
  }
}

// Singleton instance
let graphInstance: TaxonomyGraph | null = null;
let traversalInstance: TaxonomyGraphTraversal | null = null;

export function getTaxonomyGraph(): TaxonomyGraph {
  if (!graphInstance) {
    throw new Error("Taxonomy graph not initialized. Call initializeTaxonomy() first.");
  }
  return graphInstance;
}

export function getTaxonomyTraversal(): TaxonomyGraphTraversal {
  if (!traversalInstance) {
    throw new Error("Taxonomy traversal not initialized. Call initializeTaxonomy() first.");
  }
  return traversalInstance;
}

export async function initializeTaxonomy(dataPath?: string): Promise<void> {
  // Load from JSON files or use embedded data
  const builder = new TaxonomyGraphBuilder();

  // Load topics, dependencies, clusters, curricula, standards
  // This would load from the os-taxonomy data files
  // For now, we'll create a minimal structure

  // TODO: Load from actual data files
  // const topics = await loadTopics(dataPath);
  // const dependencies = await loadDependencies(dataPath);
  // etc.

  graphInstance = builder.build();
  traversalInstance = new TaxonomyGraphTraversal(graphInstance);
}

export function getTopic(topicId: string) {
  return getTaxonomyGraph().topics.get(topicId);
}

export function getAllTopics() {
  return Array.from(getTaxonomyGraph().topics.values());
}

export function getTopicsBySubject(subject: string) {
  return getTaxonomyTraversal().getTopicsBySubject(subject);
}

export function getTopicsByGrade(grade: string) {
  return getTaxonomyTraversal().getTopicsByGrade(grade);
}