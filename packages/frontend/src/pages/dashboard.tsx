"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useCompany } from "@/contexts/company-context";
import { useChat } from "@/contexts/chat-context";
import { ArrowRight, Bot, ClipboardList, DollarSign, Truck, FileText, BookOpen, Users, Activity, TrendingUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const { user } = useAuth();
  const { company, members } = useCompany();
  const { sessions } = useChat();

  const stats = [
    { name: "Active Agents", value: "3", change: "+1", icon: Bot, color: "text-blue-600 bg-blue-100" },
    { name: "Active Tasks", value: "12", change: "+3", icon: ClipboardList, color: "text-green-600 bg-green-100" },
    { name: "Revenue", value: "$47,200", change: "+12%", icon: DollarSign, color: "text-green-600 bg-green-100" },
    { name: "Active Sessions", value: "5", change: "+2", icon: Activity, color: "text-purple-600 bg-purple-100" },
  ];

  const quickActions = [
    { name: "New Task", href: "/tasks/new", icon: ClipboardList, description: "Create a new task" },
    { name: "Hire Agent", href: "/agents/hire", icon: Bot, description: "Hire a new agent" },
    { name: "New Chat", href: "/chat/new", icon: Bot, description: "Start a conversation" },
    { name: "View Finance", href: "/finance", icon: DollarSign, description: "View financials" },
  ];

  const recentActivity = [
    { id: 1, action: "Agent hired", details: "Senior Engineer hired", time: "2 min ago", icon: Bot },
    { id: 2, action: "Task completed", details: "Q3 Financial Model", time: "15 min ago", icon: ClipboardList },
    { id: 3, action: "Payment received", details: "$12,500 from Client A", time: "1 hour ago", icon: DollarSign },
    { id: 4, action: "Agent message", details: "New message from Researcher", time: "3 hours ago", icon: Bot },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || "User"}. Here's what's happening.</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button asChild>
            <Link to="/tasks/new">
              <Button>New Task</Button>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/agents/hire">
              <Button>Hire Agent</Button>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {stat.change} vs last period
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Quick Actions
                <Link to="/agents" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.name} to={action.href} className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <action.icon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{action.name}</p>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Activity
                <Link to="/activity" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <activity.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500 truncate">{activity.details}</p>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
              <CardDescription>{company?.name || "No company selected"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Agents</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Tasks</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Chat Sessions</p>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to="/settings">Manage Company</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Members
                <Link to="/team" className="text-sm text-primary-600 hover:underline">View all →</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{member.name || member.email}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      member.status === "active" && "bg-green-100 text-green-700",
                      member.status === "invited" && "bg-yellow-100 text-yellow-700"
                    )}>
                      {member.status}
                    </span>
                  </div>
                ))}
                {members.length > 5 && (
                  <Button variant="link" className="w-full text-center">
                    View all {members.length} members →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}