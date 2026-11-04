"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calculator, FileText, TrendingUp, Download, Upload, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export function Finance() {
  const [activeTab, setActiveTab] = useState("overview");

  const noiData = {
    grossIncome: 1250000,
    operatingExpenses: 450000,
    noi: 800000,
    capRate: 0.065,
    value: 12307692,
  };

  const dscrData = {
    noi: 800000,
    debtService: 520000,
    dscr: 1.54,
    covenant: 1.25,
    status: "compliant",
  };

  const packets = [
    { id: "1", name: "Pana Hub NOI Package", type: "NOI", status: "approved", version: 3, updated: "2024-01-15" },
    { id: "2", name: "DSCR Covenant Package", type: "DSCR", status: "review", version: 2, updated: "2024-01-10" },
    { id: "3", name: "UCC-1 Filing Package", type: "UCC-1", status: "draft", version: 1, updated: "2024-01-05" },
    { id: "4", name: "Revenue Waterfall", type: "Waterfall", status: "approved", version: 4, updated: "2024-01-12" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-600 mt-1">Financial modeling, packets, and compliance</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" asChild>
            <Link to="/finance/packets/new">
              <Button><FileText className="mr-2 h-4 w-4" /> New Packet</Button>
            </Link>
          </Button>
          <Button><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button><Upload className="mr-2 h-4 w-4" /> Import</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="noi">NOI Analysis</TabsTrigger>
          <TabsTrigger value="dscr">DSCR</TabsTrigger>
          <TabsTrigger value="packets">Packets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${noiData.grossIncome.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Gross Potential Income</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operating Expenses</CardTitle>
                <Calculator className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${noiData.operatingExpenses.toLocaleString()}</div>
                <p className="text-xs text-gray-500">Total Operating Expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Operating Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${noiData.noi.toLocaleString()}</div>
                <p className="text-xs text-gray-500">NOI</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DSCR</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{dscrData.dscr.toFixed(2)}x</div>
                <p className="text-xs text-gray-500">Covenant: {dscrData.covenant}x • {dscrData.status}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>NOI Waterfall</CardTitle>
                <CardDescription>Income allocation breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Gross Potential Income", value: noiData.grossIncome, color: "bg-blue-500" },
                    { label: "Vacancy & Credit Loss", value: -50000, color: "bg-red-500" },
                    { label: "Effective Gross Income", value: 1200000, color: "bg-blue-500" },
                    { label: "Operating Expenses", value: -noiData.operatingExpenses, color: "bg-red-500" },
                    { label: "Net Operating Income", value: noiData.noi, color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="font-mono text-sm font-medium">
                          ${Math.abs(item.value).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DSCR Compliance</CardTitle>
                <CardDescription>Debt Service Coverage Ratio tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-500">Current DSCR</p>
                      <p className="text-3xl font-bold text-green-600">{dscrData.dscr.toFixed(2)}x</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500">Covenant Minimum</p>
                      <p className="text-3xl font-bold text-blue-600">{dscrData.covenant}x</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-3xl font-bold text-green-600">{dscrData.status}</p>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(dscrData.dscr / dscrData.covenant, 1) * 100}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-500">DSCR Coverage: {(dscrData.dscr / dscrData.covenant * 100).toFixed(1)}% of covenant</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="noi" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>NOI Analysis</CardTitle>
                <CardDescription>Detailed Net Operating Income breakdown</CardDescription>
              </div>
              <Button variant="outline" asChild>
                <Link to="/finance/noi/new"><Button><FileText className="mr-2 h-4 w-4" /> New Analysis</Button></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Gross Potential Income</p>
                    <p className="text-2xl font-bold">${noiData.grossIncome.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Vacancy & Credit Loss</p>
                    <p className="text-2xl font-bold text-red-600">($50,000)</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Effective Gross Income</p>
                    <p className="text-2xl font-bold">${(noiData.grossIncome - 50000).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Operating Expenses</p>
                    <p className="text-2xl font-bold text-red-600">(${noiData.operatingExpenses.toLocaleString()})</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Net Operating Income</span>
                    <span className="text-2xl font-bold text-green-600">${noiData.noi.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Cap Rate: {(noiData.capRate * 100).toFixed(1)}% • Value: ${noiData.value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dscr" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>DSCR Analysis</CardTitle>
                <CardDescription>Debt Service Coverage Ratio monitoring</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Current DSCR</p>
                  <p className="text-4xl font-bold text-green-600">{dscrData.dscr.toFixed(2)}x</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">Covenant Minimum</p>
                  <p className="text-4xl font-bold text-blue-600">{dscrData.covenant}x</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-4xl font-bold text-green-600">{dscrData.status}</p>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(dscrData.dscr / dscrData.covenant, 1) * 100}%` }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">NOI</p>
                  <p className="font-mono font-medium">${noiData.noi.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Debt Service</p>
                  <p className="font-mono font-medium">${dscrData.debtService.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Coverage</p>
                  <p className="font-mono font-medium">{(dscrData.dscr / dscrData.covenant * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Cushion</p>
                  <p className="font-mono font-medium">${(dscrData.noi - dscrData.debtService * dscrData.covenant).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packets" className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Finance Packets</h2>
              <p className="text-gray-600">Version-controlled financial documents</p>
            </div>
            <Button asChild>
              <Link to="/finance/packets/new">
                <Button><FileText className="mr-2 h-4 w-4" /> New Packet</Button>
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 px-4 font-medium">Packet</th>
                  <th className="pb-3 px-4 font-medium">Type</th>
                  <th className="pb-3 px-4 font-medium">Status</th>
                  <th className="pb-3 px-4 font-medium">Version</th>
                  <th className="pb-3 px-4 font-medium">Updated</th>
                  <th className="pb-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {packets.map((packet) => (
                  <tr key={packet.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <p className="font-medium text-gray-900">{packet.name}</p>
                      <p className="text-sm text-gray-500">{packet.type}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={
                        packet.status === "approved" ? "default" :
                        packet.status === "review" ? "secondary" :
                        "outline"
                      }>
                        {packet.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">v{packet.version}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{packet.updated}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Upload className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}