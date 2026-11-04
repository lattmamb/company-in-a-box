"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { useCompany } from "@/contexts/company-context";
import { useTheme } from "@/components/theme-provider";
import { User, Bell, Shield, Palette, Database, Key, Moon, Sun, Save, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function Settings() {
  const { user, logout } = useAuth();
  const { company, members, inviteMember } = useCompany();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    tasks: true,
    mentions: true,
    weekly: false,
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: 30,
  });
  const [companySettings, setCompanySettings] = useState({
    name: company?.name || "",
    slug: company?.slug || "",
    timezone: "UTC",
    currency: "USD",
  });
  const [savingTab, setSavingTab] = useState<string | null>(null);

  const handleSave = async (tab: string) => {
    setSavingTab(tab);
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSavingTab(null);
    setSaving(false);
  };

  // shortcut: role change is local-only until the members API exists.
  const updateMemberRole = (_memberId: string, _role: string) => {};

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account, preferences, and company settings</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            Company
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <div className="relative h-20 w-20">
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {profile.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <Button variant="outline" className="mt-4">Change Avatar</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>

              <Button onClick={() => handleSave("profile")} disabled={savingTab === "profile" || saving}>
                {savingTab === "profile" && saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <>
<Save className="mr-2 h-4 w-4" />
                    Save Changes
                    </>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
                  { key: "push", label: "Push Notifications", description: "Receive push notifications in the app" },
                  { key: "tasks", label: "Task Updates", description: "Get notified about task updates and assignments" },
                  { key: "mentions", label: "Mentions", description: "Get notified when you're mentioned" },
                  { key: "weekly", label: "Weekly Digest", description: "Receive a weekly summary of activity" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={() => handleSave("notifications")} disabled={savingTab === "notifications" && saving}>
                {savingTab === "notifications" && saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <>
<Save className="mr-2 h-4 w-4" />
                    Save Preferences
                    </>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Add an extra layer of security with 2FA</p>
                </div>
                <Switch
                  checked={security.twoFactor}
                  onCheckedChange={(checked) => setSecurity(prev => ({ ...prev, twoFactor: checked }))}
                />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                      min="5"
                      max="1440"
                      className="w-32"
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("security")} disabled={savingTab === "security" && saving}>
                  {savingTab === "security" && saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
<Save className="mr-2 h-4 w-4" />
                    Save Security Settings
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Active Sessions
                <span className="text-sm text-gray-500">3 active sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { device: "MacBook Pro (Current)", location: "San Francisco, CA", lastActive: "Now", current: true },
                  { device: "iPhone 15", location: "San Francisco, CA", lastActive: "2 hours ago", current: false },
                  { device: "iPad Pro", location: "Home", lastActive: "1 day ago", current: false },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">💻</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{session.device}</p>
                        <p className="text-sm text-gray-500">{session.location} • {session.lastActive}</p>
                      </div>
                    </div>
                    {session.current ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Current</span>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">Revoke All Other Sessions</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Tab */}
        <TabsContent value="company" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>Manage your company information and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={companySettings.slug}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="company-slug"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={companySettings.timezone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="Europe/London">London</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={companySettings.currency}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-4">Team Members</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {members.slice(0, 10).map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate">{member.name || member.email}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Invite Member
                </Button>
              </div>

              <Button onClick={() => handleSave("company")} disabled={savingTab === "company" && saving} className="mt-6">
                {savingTab === "company" && saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <>
<Save className="mr-2 h-4 w-4" />
                    Save Company Settings
                    </>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}