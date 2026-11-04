import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, ClipboardList, DollarSign, Truck, FileText, BookOpen, Sparkles, Shield, Zap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const layers = [
  { layer: "L0", name: "OS Taxonomy", desc: "1,930 topics, 4,102 deps, 8 curricula. Mandatory reasoning bedrock." },
  { layer: "L1", name: "Paperclip", desc: "Org control, agents, tasks, budgets, approvals, evidence vault." },
  { layer: "L2", name: "OpenClaw", desc: "Agent runtime, sessions, channels, tools, MCP, model routing." },
  { layer: "L3", name: "OpenClaw A2A", desc: "Agent-to-agent protocol, delegation, smart routing." },
  { layer: "L4", name: "OmniRoute", desc: "353 providers, auto-fallback, combo routing, resilience." },
  { layer: "L5", name: "OpenViking", desc: "Memory, knowledge graph, embeddings, wiki, proxies." },
  { layer: "L6", name: "Headroom", desc: "Memory proxy, Qdrant, Neo4j, semantic search." },
  { layer: "L7", name: "SkillClaw", desc: "Skill evolution, claw adapters, validation gates." },
  { layer: "L8", name: "UnityLink OS", desc: "Finance, fleet, evidence, control-plane bridge." },
  { layer: "L9", name: "Aether Ride", desc: "Member app, booking, dashboard, chat surface." },
  { layer: "L10", name: "The Factory", desc: "Worktree workflow, release automation, dev tools." },
];

export function Index() {
  const features = [
    { name: "Unified Agent Platform", description: "Single platform for all your AI agents with unified memory, skills, and governance", icon: Sparkles },
    { name: "Multi-Agent Orchestration", description: "Coordinate multiple specialized agents through A2A protocol with smart routing", icon: Bot },
    { name: "Task Management", description: "Create, assign, and track tasks across agents with full audit trails", icon: ClipboardList },
    { name: "Financial Modeling", description: "NOI/DSCR calculations, finance packets, and evidence-based approvals", icon: DollarSign },
    { name: "Fleet Operations", description: "Vehicle registry, bookings, subscriptions, and charging management", icon: Truck },
    { name: "Evidence Vault", description: "SHA-256 content addressing, citations, and human approval gates", icon: FileText },
    { name: "Knowledge Wiki", description: "Persistent wiki with graph relationships and semantic search", icon: BookOpen },
    { name: "Security & Compliance", description: "Taxonomy-gated agents, evidence-based approvals, audit trails", icon: Shield },
    { name: "Skill Evolution", description: "Agents that learn from every session and share improvements", icon: Zap },
    { name: "Team Collaboration", description: "Role-based agents with approval gates and human-in-the-loop", icon: Users },
  ];

  const stats = [
    { value: "10+", label: "Integrated Repos" },
    { value: "10", label: "Core Packages" },
    { value: "100%", label: "TypeScript" },
    { value: "1", label: "Unified Platform" },
  ];

  return (
    <div className="min-h-screen bg-[hsl(215_40%_4%)] text-[hsl(210_30%_96%)] antialiased">
      {/* Status strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between text-[hsl(213_16%_64%)]">
          <span className="micro-label">Company in a Box</span>
          <div className="flex items-center gap-3">
            <span className="micro-label hidden sm:inline">v0.1</span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
        </div>
      </div>

      {/* Hero — Unity Fleet fullscreen-claim pattern */}
      <section className="relative overflow-hidden">
        {/* Ambient glow, stand-in for the template videos */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[560px] w-[900px] rounded-full bg-primary/10 blur-[140px]" />
          <div className="absolute bottom-0 right-0 h-[360px] w-[520px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 lg:pt-36 lg:pb-40">
          <div className="text-center max-w-4xl mx-auto">
            <p className="micro-label text-primary mb-8">New — Unified agent platform</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8">
              One Platform.<br />
              <span className="text-primary">All Your Agents.</span>
            </h1>
            <p className="text-lg sm:text-xl text-[hsl(213_16%_64%)] mb-12 max-w-2xl mx-auto">
              Organizational control, agent runtime, model gateway, memory layer, skill evolution,
              and domain applications in a single codebase.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto px-8 py-3.5 text-base rounded-full font-semibold">
                  Start Experience
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3.5 text-base rounded-full border-white/20 text-[hsl(210_30%_96%)] hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stat readouts — giant numeral pattern */}
      <section className="border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="display-num text-primary">{s.value}</div>
                <div className="micro-label text-[hsl(213_16%_64%)] mt-3">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 lg:py-36">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-3xl">
            <p className="micro-label text-primary mb-4">Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need.<br />Nothing in the way.
            </h2>
            <p className="text-lg text-[hsl(213_16%_64%)]">
              Ten integrated packages. One unified platform. Zero context switching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Link
                key={feature.name}
                to="/register"
                className="group surface-glass p-7 transition-colors hover:border-primary/40 hover:bg-card/90"
              >
                <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center mb-6">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.name}</h3>
                <p className="text-sm text-[hsl(213_16%_64%)]">{feature.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 micro-label text-primary/80 group-hover:text-primary">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 bg-[hsl(215_35%_6%)] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 max-w-3xl">
            <p className="micro-label text-primary mb-4">Architecture</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Layered Architecture</h2>
            <p className="text-lg text-[hsl(213_16%_64%)]">Ten layers. Clear boundaries. Zero vendor lock-in.</p>
          </div>

          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.layer}
                className="flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.04] transition-colors"
              >
                <div className="h-10 w-14 shrink-0 rounded-full border border-primary/30 text-primary flex items-center justify-center font-semibold text-xs tracking-wider">
                  {layer.layer}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px]">{layer.name}</h3>
                  <p className="text-sm text-[hsl(213_16%_64%)] truncate">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — embedded dark panel pattern */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="surface-glass overflow-hidden text-center px-6 py-20 relative">
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[320px] w-[640px] rounded-full bg-primary/10 blur-[110px]" aria-hidden="true" />
            <h2 className="relative text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to build your agent company?
            </h2>
            <p className="relative text-lg text-[hsl(213_16%_64%)] mb-10 max-w-xl mx-auto">
              Join the unified agent platform. Start free, scale infinitely.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="px-8 py-3.5 text-base rounded-full font-semibold">
                  Start Free
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3.5 text-base rounded-full border-white/20 text-[hsl(210_30%_96%)] hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-14 text-[hsl(213_16%_64%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <h3 className="text-foreground font-semibold mb-4">Company in a Box</h3>
              <p className="text-sm">Unified agent platform for the modern enterprise.</p>
            </div>
            <div>
              <h4 className="micro-label text-foreground/80 mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-foreground">Paperclip</a></li>
                <li><a href="#" className="hover:text-foreground">OpenClaw</a></li>
                <li><a href="#" className="hover:text-foreground">OmniRoute</a></li>
                <li><a href="#" className="hover:text-foreground">OpenViking</a></li>
              </ul>
            </div>
            <div>
              <h4 className="micro-label text-foreground/80 mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="micro-label text-foreground/80 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
          </div>
          <div className={cn("mt-10 border-t border-white/10 pt-8 text-sm")}>
            © 2024 Company in a Box. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
