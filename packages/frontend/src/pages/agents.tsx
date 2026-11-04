"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Search, Filter, Settings, Play, Pause, Trash2, Edit, Eye, Download, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "running" | "paused" | "error";
  adapter: string;
  tasksCompleted: number;
  lastActive: string;
}

const mockAgents: Agent[] = [
  { id: "1", name: "Chief of Staff", role: "Management", status: "running", adapter: "openclaw", tasksCompleted: 42, lastActive: "2 min ago" },
  { id: "2", name: "Senior Engineer", role: "Engineering", status: "idle", adapter: "openclaw", tasksCompleted: 128, lastActive: "5 min ago" },
  { id: "3", name: "Research Analyst", role: "Research", status: "running", adapter: "openclaw", tasksCompleted: 67, lastActive: "1 min ago" },
  { id: "4", name: "Finance Analyst", role: "Finance", status: "idle", adapter: "openclaw", tasksCompleted: 34, lastActive: "10 min ago" },
  { id: "5", name: "Security Engineer", role: "Security", status: "paused", adapter: "openclaw", tasksCompleted: 15, lastActive: "1 hour ago" },
  { id: "6", name: "Support Engineer", role: "Support", status: "running", adapter: "openclaw", tasksCompleted: 89, lastActive: "30 sec ago" },
];

export function Agents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-600 mt-1">Manage your agent workforce</p>
        </div>
        <Button asChild>
          <Link to="/agents/hire">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Hire Agent
            </Button>
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Agent List</TabsTrigger>
          <TabsTrigger value="hiring">Hiring</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="idle">Idle</option>
                <option value="paused">Paused</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 px-4 font-medium">Agent</th>
                  <th className="pb-3 px-4 font-medium">Role</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium">Adapter</th>
                  <th className="pb-3 px-4 font-medium">Tasks</th>
                  <th className="pb-3 px-4 font-medium">Last Active</th>
                  <th className="pb-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockAgents
                  .filter(agent => 
                    (statusFilter === "all" || agent.status === statusFilter) &&
                    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{agent.name}</p>
                            <p className="text-sm text-gray-500">{agent.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-900">{agent.role}</td>
                      <td className="py-4 px-4">
                        <Badge variant={cn(
                          agent.status === "running" && "bg-green-100 text-green-700",
                          agent.status === "idle" && "bg-gray-100 text-gray-700",
                          agent.status === "paused" && "bg-yellow-100 text-yellow-700",
                          agent.status === "error" && "bg-red-100 text-red-700"
                        )}>
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">{agent.adapter}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{agent.tasksCompleted}</td>
                      <td className="py-4 px-4 text-sm text-gray-500">{agent.lastActive}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title={agent.status === "running" ? "Pause" : "Start"}>
                            {agent.status === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Configure">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="hiring" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hire New Agent</CardTitle>
                <CardDescription>Select a role template or create a custom agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { name: "Software Engineer", role: "engineering", skills: ["code-review", "testing", "debugging"] },
                    { name: "Research Analyst", role: "research", skills: ["web-search", "synthesis", "citation"] },
                    { name: "Finance Analyst", role: "finance", skills: ["financial-modeling", "dscr-calculation"] },
                    { name: "Security Engineer", role: "security", skills: ["threat-modeling", "vulnerability-assessment"] },
                    { name: "Support Engineer", role: "support", skills: ["ticket-triage", "troubleshooting"] },
                    { name: "Project Manager", role: "management", skills: ["planning", "delegation", "reporting"] },
                  ].map((role) => (
                    <Card key={role.name} className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {role.name}
                          <Bot className="h-5 w-5 text-primary-600" />
                        </CardTitle>
                        <CardDescription>{role.role}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {role.skills.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                        <Button className="w-full mt-4" asChild>
                          <Link to={`/agents/hire/${role.name.toLowerCase().replace(" ", "-")}`}>
                            <Button className="w-full">Hire</Button>
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Templates</CardTitle>
              <CardDescription>Pre-built agent configurations for common roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Senior Engineer", category: "Engineering", downloads: 1247, rating: 4.9 },
                  { name: "Research Analyst", category: "Research", downloads: 892, rating: 4.8 },
                  { name: "Finance Analyst", category: "Finance", downloads: 654, rating: 4.7 },
                  { name: "Security Engineer", category: "Security", downloads: 432, rating: 4.9 },
                  { name: "Support Engineer", category: "Support", downloads: 789, rating: 4.6 },
                  { name: "Project Manager", category: "Management", downloads: 567, rating: 4.8 },
                ].map((template) => (
                  <Card key={template.name} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription>{template.category}</CardDescription>
                        </div>
                        <Badge variant="secondary">{template.rating}★</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{template.downloads} downloads</span>
                      <Button variant="outline" size="sm">Use Template</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}