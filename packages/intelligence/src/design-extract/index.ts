import { ulid } from "ulid";
import { EventEmitter } from "events";
import { z } from "zod";

export interface DesignToken {
  id: string;
  name: string;
  category: "color" | "spacing" | "typography" | "border" | "shadow" | "animation" | "breakpoint" | "z-index" | "opacity" | "other";
  value: string | number;
  description?: string;
  tags: string[];
  references: string[]; // Files/components that use this token
}

export interface DesignComponent {
  id: string;
  name: string;
  type: "atom" | "molecule" | "organism" | "template" | "page";
  description: string;
  props: ComponentProp[];
  slots: ComponentSlot[];
  variants: ComponentVariant[];
  states: ComponentState[];
  dependencies: string[]; // Other component IDs
  tokens: string[]; // Token IDs used
  code: string; // Source code
  preview: string; // Preview URL or base64 image
  metadata: Record<string, any>;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description: string;
  controlType?: "text" | "number" | "boolean" | "select" | "color" | "object";
  options?: any[];
}

export interface ComponentSlot {
  name: string;
  description: string;
  required: boolean;
  allowedComponents?: string[];
}

export interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, any>;
  preview: string;
}

export interface ComponentState {
  name: string;
  description: string;
  props: Record<string, any>;
  preview: string;
}

export interface DesignSystem {
  id: string;
  name: string;
  version: string;
  tokens: DesignToken[];
  components: DesignComponent[];
  themes: Theme[];
  guidelines: DesignGuideline[];
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  tokens: Record<string, string>; // Token ID -> value override
  extends?: string; // Parent theme ID
}

export interface DesignGuideline {
  id: string;
  title: string;
  category: "accessibility" | "brand" | "layout" | "interaction" | "content" | "performance";
  description: string;
  severity: "error" | "warning" | "info";
  rule: string; // Machine-checkable rule
  examples: { good: string; bad: string }[];
}

export interface ExtractionOptions {
  source: "figma" | "sketch" | "adobe-xd" | "code" | "url" | "image";
  sourceUrl?: string;
  sourceFiles?: string[];
  includeTokens: boolean;
  includeComponents: boolean;
  includeGuidelines: boolean;
  framework?: "react" | "vue" | "svelte" | "html" | "flutter" | "swiftui" | "jetpack-compose";
  outputFormat: "json" | "typescript" | "css" | "scss" | "figma" | "storybook";
}

export interface ExtractionResult {
  designSystem: DesignSystem;
  extractedAt: number;
  source: string;
  warnings: string[];
  errors: string[];
}

export interface DesignExtractionConfig {
  figmaToken?: string;
  figmaFileId?: string;
  githubToken?: string;
  githubRepo?: string;
  outputDir: string;
  frameworks: string[];
  tokenNamingConvention: "kebab-case" | "camelCase" | "PascalCase" | "SCREAMING_SNAKE_CASE";
  componentNamingConvention: "kebab-case" | "camelCase" | "PascalCase";
}

export class DesignExtractor extends EventEmitter {
  private config: DesignExtractionConfig;
  private designSystems: Map<string, DesignSystem> = new Map();

  constructor(config: Partial<DesignExtractionConfig> = {}) {
    super();
    this.config = {
      figmaToken: config.figmaToken,
      figmaFileId: config.figmaFileId,
      githubToken: config.githubToken,
      githubRepo: config.githubRepo,
      outputDir: config.outputDir || "./design-system",
      frameworks: config.frameworks || ["react", "typescript"],
      tokenNamingConvention: config.tokenNamingConvention || "kebab-case",
      componentNamingConvention: config.componentNamingConvention || "PascalCase",
    };
  }

  async extractFromFigma(fileId?: string, token?: string): Promise<ExtractionResult> {
    const fileId = fileId || this.config.figmaFileId;
    const token = token || this.config.figmaToken;

    if (!fileId || !token) {
      throw new Error("Figma file ID and token required");
    }

    // In a real implementation, this would call Figma API
    // For now, return mock result
    const designSystem = this.createMockDesignSystem("figma-extraction");
    this.designSystems.set(designSystem.id, designSystem);

    return {
      designSystem,
      extractedAt: Date.now(),
      source: `figma:${fileId}`,
      warnings: ["Mock extraction - Figma API not implemented"],
      errors: [],
    };
  }

  async extractFromCode(sourceFiles: string[], framework: string = "react"): Promise<ExtractionResult> {
    // In a real implementation, this would parse source files
    // For now, return mock result
    const designSystem = this.createMockDesignSystem("code-extraction");
    this.designSystems.set(designSystem.id, designSystem);

    return {
      designSystem,
      extractedAt: Date.now(),
      source: `code:${sourceFiles.join(",")}`,
      warnings: ["Mock extraction - code parsing not implemented"],
      errors: [],
    };
  }

  async extractFromURL(url: string): Promise<ExtractionResult> {
    // In a real implementation, this would fetch and analyze the URL
    const designSystem = this.createMockDesignSystem("url-extraction");
    this.designSystems.set(designSystem.id, designSystem);

    return {
      designSystem,
      extractedAt: Date.now(),
      source: `url:${url}`,
      warnings: ["Mock extraction - URL parsing not implemented"],
      errors: [],
    };
  }

  async extractFromImage(imagePath: string): Promise<ExtractionResult> {
    // In a real implementation, this would use OCR/computer vision
    const designSystem = this.createMockDesignSystem("image-extraction");
    this.designSystems.set(designSystem.id, designSystem);

    return {
      designSystem,
      extractedAt: Date.now(),
      source: `image:${imagePath}`,
      warnings: ["Mock extraction - image parsing not implemented"],
      errors: [],
    });
  }

  private createMockDesignSystem(source: string): any {
    const id = ulid();
    return {
      id,
      name: `Design System from ${source}`,
      version: "1.0.0",
      tokens: [
        {
          id: ulid(),
          name: "color-primary",
          category: "color",
          value: "#0066cc",
          description: "Primary brand color",
          tags: ["brand", "primary"],
          references: [],
        },
        {
          id: ulid(),
          name: "color-secondary",
          category: "color",
          value: "#6c757d",
          description: "Secondary brand color",
          tags: ["brand", "secondary"],
          references: [],
        },
        {
          id: ulid(),
          name: "spacing-md",
          category: "spacing",
          value: "16px",
          description: "Medium spacing",
          tags: ["layout", "spacing"],
          references: [],
        },
        {
          id: ulid(),
          name: "font-family-base",
          category: "typography",
          value: "system-ui, -apple-system, sans-serif",
          description: "Base font family",
          tags: ["typography", "font"],
          references: [],
        },
      ],
      components: [
        {
          id: ulid(),
          name: "Button",
          type: "atom",
          description: "Primary button component",
          props: [
            { name: "variant", type: "string", required: false, default: "primary", description: "Button variant", controlType: "select", options: ["primary", "secondary", "outline", "ghost"] },
            { name: "size", type: "string", required: false, default: "md", description: "Button size", controlType: "select", options: ["sm", "md", "lg"] },
            { name: "disabled", type: "boolean", required: false, default: false, description: "Disabled state" },
            { name: "onClick", type: "function", required: false, description: "Click handler" },
            { name: "children", type: "node", required: true, description: "Button content" },
          ],
          slots: [],
          variants: [
            { name: "primary", description: "Primary variant", props: { variant: "primary" }, preview: "" },
            { name: "secondary", description: "Secondary variant", props: { variant: "secondary" }, preview: "" },
          ],
          states: [
            { name: "hover", description: "Hover state", props: {}, preview: "" },
            { name: "active", description: "Active state", props: {}, preview: "" },
            { name: "disabled", description: "Disabled state", props: { disabled: true }, preview: "" },
          ],
          dependencies: [],
          tokens: [],
          code: "// Button component code",
          preview: "",
          metadata: {},
        },
      ],
      themes: [
        {
          id: ulid(),
          name: "light",
          description: "Light theme",
          tokens: { "color-primary": "#0066cc", "color-background": "#ffffff" },
        },
        {
          id: ulid(),
          name: "dark",
          description: "Dark theme",
          tokens: { "color-primary": "#4d9fff", "color-background": "#1a1a1a" },
          extends: "light",
        },
      ],
      guidelines: [
        {
          id: ulid(),
          title: "Color Contrast",
          category: "accessibility",
          description: "Ensure sufficient color contrast for text",
          severity: "error",
          rule: "WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text",
          examples: { good: "White text on #0066cc background", bad: "Gray text on #0066cc background" },
        },
        {
          id: ulid(),
          title: "Consistent Spacing",
          category: "layout",
          description: "Use design tokens for consistent spacing",
          severity: "warning",
          rule: "Use spacing tokens (spacing-xs, spacing-sm, spacing-md, spacing-lg, spacing-xl)",
          examples: { good: "margin: var(--spacing-md)", bad: "margin: 16px" },
        },
      ],
      version: "1.0.0",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async generateOutput(designSystemId: string, format: "json" | "typescript" | "css" | "scss" | "figma" | "storybook"): Promise<string> {
    const designSystem = this.designSystems.get(designSystemId);
    if (!designSystem) throw new Error("Design system not found");

    switch (format) {
      case "json":
        return JSON.stringify(designSystem, null, 2);
      case "typescript":
        return this.generateTypeScript(designSystem);
      case "css":
        return this.generateCSS(designSystem);
      case "scss":
        return this.generateSCSS(designSystem);
      case "figma":
        return this.generateFigmaJSON(designSystem);
      case "storybook":
        return this.generateStorybook(designSystem);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private generateTypeScript(designSystem: any): string {
    let output = `// Generated Design System Types\n// Generated at ${new Date().toISOString()}\n\n`;

    // Tokens
    output += `export const tokens = {\n`;
    for (const token of designSystem.tokens) {
      output += `  ${this.toCamelCase(token.name)}: "${token.value}",\n`;
    }
    output += `} as const;\n\n`;

    // Theme types
    output += `export type Theme = {\n`;
    for (const theme of designSystem.themes) {
      output += `  ${theme.name}: {\n`;
      for (const [tokenName, value] of Object.entries(theme.tokens)) {
        output += `    ${this.toCamelCase(tokenName)}: string;\n`;
      }
      output += `  };\n`;
    }
    output += `};\n\n`;

    // Component types
    for (const component of designSystem.components) {
      output += `export interface ${component.name}Props {\n`;
      for (const prop of component.props) {
        const tsType = this.mapPropType(prop.type);
        const optional = prop.required ? "" : "?";
        output += `  ${prop.name}${optional}: ${tsType};\n`;
      }
      output += `}\n\n`;
    }

    return output;
  }

  private generateCSS(designSystem: any): string {
    let output = `:root {\n`;
    for (const token of designSystem.tokens) {
      const cssVar = `--${this.toKebabCase(token.name)}`;
      output += `  ${cssVar}: ${token.value};\n`;
    }
    output += `}\n\n`;

    // Theme overrides
    for (const theme of designSystem.themes) {
      if (theme.extends) {
        output += `[data-theme="${theme.name}"] {\n`;
      } else {
        output += `@media (prefers-color-scheme: ${theme.name}) {\n`;
      }
      for (const [tokenName, value] of Object.entries(theme.tokens)) {
        output += `  --${this.toKebabCase(tokenName)}: ${value};\n`;
      }
      output += `}\n\n`;
    }

    return output;
  }

  private generateSCSS(designSystem: any): string {
    let output = `$tokens: (\n`;
    for (const token of designSystem.tokens) {
      output += `  ${this.toKebabCase(token.name)}: ${token.value},\n`;
    }
    output += `);\n\n`;

    output += `@mixin token($name) {\n  @return map-get($tokens, $name);\n}\n\n`;

    for (const theme of designSystem.themes) {
      output += `$theme-${theme.name}: (\n`;
      for (const [tokenName, value] of Object.entries(theme.tokens)) {
        output += `  ${this.toKebabCase(tokenName)}: ${value},\n`;
      }
      output += `);\n\n`;
    }

    return output;
  }

  private generateFigmaJSON(designSystem: any): string {
    // Figma plugin format
    return JSON.stringify({
      name: designSystem.name,
      version: designSystem.version,
      tokens: designSystem.tokens.map(t => ({
        name: t.name,
        value: t.value,
        type: t.category,
        description: t.description,
      })),
      components: designSystem.components.map(c => ({
        name: c.name,
        description: c.description,
        props: c.props,
        variants: c.variants,
      })),
    }, null, 2);
  }

  private generateStorybook(designSystem: any): string {
    let output = `// Storybook stories for ${designSystem.name}\n\n`;
    
    for (const component of designSystem.components) {
      output += `import type { Meta, StoryObj } from '@storybook/react';\n`;
      output += `import { ${component.name} } from './${component.name}';\n\n`;
      output += `const meta: Meta<typeof ${component.name}> = {\n`;
      output += `  title: 'Components/${component.name}',\n`;
      output += `  component: ${component.name},\n`;
      output += `  tags: ['autodocs'],\n`;
      output += `  argTypes: {\n`;
      for (const prop of component.props) {
        output += `    ${prop.name}: { control: '${prop.controlType || "text"}' },\n`;
      }
      output += `  },\n`;
      output += `};\n\n`;
      output += `export default meta;\n\n`;
      output += `type Story = StoryObj<typeof ${component.name}>;\n\n`;
      
      for (const variant of component.variants) {
        output += `export const ${this.toPascalCase(variant.name)}: Story = {\n`;
        output += `  args: ${JSON.stringify(variant.props, null, 2)},\n`;
        output += `};\n\n`;
      }
    }

    return output;
  }

  private toCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|-)([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  getDesignSystem(id: string): any | undefined {
    return this.designSystems.get(id);
  }

  listDesignSystems(): any[] {
    return Array.from(this.designSystems.values());
  }

  deleteDesignSystem(id: string): boolean {
    return this.designSystems.delete(id);
  }
}

export const designExtractor = new DesignExtractor();