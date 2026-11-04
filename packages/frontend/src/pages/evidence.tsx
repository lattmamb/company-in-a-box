"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Filter, Download, Upload, Eye, Hash, Shield, Clock, AlertTriangle, CheckCircle, XCircle, FilePlus, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvidenceItem {
  id: string;
  title: string;
  kind: string;
  description: string;
  fileName: string;
  sha256: string;
  status: "draft" | "verified" | "archived" | "disputed";
  source: string;
  tags: string[];
  createdAt: number;
  createdBy: string;
}

const mockEvidence = [
  { id: "1", title: "Pana Hub NOI Analysis", kind: "financial", description: "NOI analysis for Pana hub project", fileName: "pana-noi-analysis.pdf", sha256: "a1b2c3d4e5f6...", status: "verified", source: "upload", tags: ["finance", "noi", "pana"], createdAt: Date.now() - 86400000, createdBy: "Finance Analyst" },
  { id: "2", title: "DSCR Covenant Package", kind: "financial", description: "DSCR covenant compliance package", fileName: "dscr-covenant.pdf", sha256: "f6e5d4c3b2a1...", status: "review", source: "generated", tags: ["finance", "dscr", "covenant"], createdAt: Date.now() - 172800000, createdBy: "Finance Analyst" },
  { id: "3", title: "UCC-1 Filing Template", kind: "legal", description: "UCC-1 financing statement template", fileName: "ucc1-template.docx", sha256: "9f8e7d6c5b4a...", status: "draft", source: "upload", tags: ["legal", "ucc1", "template"], createdAt: Date.now() - 259200000, createdBy: "Legal Counsel" },
  { id: "4", title: "Vehicle Registration", kind: "legal", description: "Tesla Model 3 registration docs", fileName: "tesla-reg.pdf", sha256: "3a2b1c4d5e6f...", status: "verified", source: "upload", tags: ["fleet", "registration", "tesla"], createdAt: Date.now() - 345600000, createdBy: "Fleet Manager" },
];

export function Evidence() {
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("browse");

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    verified: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-700",
    disputed: "bg-red-100 text-red-700",
    review: "bg-yellow-100 text-yellow-700",
  };

  const kindIcons = {
    financial: <DollarSign className="h-4 w-4 text-green-600" />,
    legal: <Shield className="h-4 w-4 text-blue-600" />,
    technical: <FileText className="h-4 w-4 text-purple-600" />,
    operational: <Clock className="h-4 w-4 text-orange-600" />,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evidence Vault</h1>
          <p className="text-gray-600 mt-1">SHA-256 content addressing, citations, and approval gates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link to="/evidence/upload">
              <Button><FilePlus className="mr-2 h-4 w-4" /> Upload</Button>
            </Link>
          </Button>
          <Button><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button><Upload className="mr-2 h-4 w-4" /> Import</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search evidence..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={kindFilter} onValueChange={setKindFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 px-4 font-medium">Evidence</th>
                  <th className="pb-3 px-4 font-medium">Type</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium">SHA-256</th>
                  <th className="pb-3 px-4 font-medium">Source</th>
                  <th className="pb-3 px-4 font-medium">Created</th>
                  <th className="pb-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockEvidence
                  .filter(e => 
                    (kindFilter === "all" || e.kind === kindFilter) &&
                    (statusFilter === "all" || e.status === statusFilter) &&
                    (e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     e.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((evidence) => (
                    <tr key={evidence.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{evidence.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{evidence.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {evidence.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {kindIcons[evidence.kind as keyof typeof kindIcons] || <FileText className="h-4 w-4 text-gray-400" />}
                          <span className="text-sm capitalize">{evidence.kind}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={evidence.status === "verified" ? "default" : evidence.status === "review" ? "secondary" : evidence.status === "draft" ? "outline" : "destructive"}>
                          {evidence.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-xs font-mono text-gray-500 truncate max-w-[150px] block">{evidence.sha256}</code>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-500 capitalize">{evidence.source}</span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">{new Date(evidence.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Hash className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="verify" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Verify Evidence</CardTitle>
              <CardDescription>Verify evidence integrity using SHA-256 hash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="file">Upload File to Verify</Label>
                <Input type="file" id="file" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="hash">Or Enter SHA-256 Hash</Label>
                <Input placeholder="Enter SHA-256 hash..." />
              </div>
              <Button className="w-full">Verify</Button>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Upload a file or enter a SHA-256 hash to verify its integrity against the evidence vault.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Evidence access and modification history</CardDescription>
              </div>
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                      <th className="pb-3 px-4 font-medium">Timestamp</th>
                      <th className="pb-3 px-4 font-medium">Action</th>
                      <th className="pb-3 px-4 font-medium">User</th>
                      <th className="pb-3 px-4 font-medium">Evidence</th>
                      <th className="pb-3 px-4 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { time: "2 min ago", action: "Verified", user: "Finance Analyst", evidence: "Pana Hub NOI Analysis", details: "SHA-256 match confirmed" },
                      { time: "15 min ago", action: "Uploaded", user: "Legal Counsel", evidence: "UCC-1 Filing Template", details: "Initial upload" },
                      { time: "1 hour ago", action: "Viewed", user: "Fleet Manager", evidence: "Vehicle Registration", details: "Accessed for audit" },
                      { time: "3 hours ago", action: "Downloaded", user: "Finance Analyst", evidence: "DSCR Covenant Package", details: "Downloaded for review" },
                    ].map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-500">{log.time}</td>
                        <td className="py-4 px-4">
                          <Badge variant={log.action === "Verified" ? "default" : log.action === "Uploaded" ? "secondary" : "outline"}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900">{log.user}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{log.evidence}</td>
                        <td className="py-4 px-4 text-sm text-gray-500">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}