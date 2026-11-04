"use client";

import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Menu, Sun, Moon, LogOut, Settings, Bell, Search, Home, Bot, ClipboardList, DollarSign, Truck, FileText, BookOpen, Settings as SettingsIcon, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/components/theme-provider";

export function Layout({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Chat", href: "/chat", icon: Bot },
    { name: "Agents", href: "/agents", icon: Bot },
    { name: "Tasks", href: "/tasks", icon: ClipboardList },
    { name: "Finance", href: "/finance", icon: DollarSign },
    { name: "Fleet", href: "/fleet", icon: Truck },
    { name: "Evidence", href: "/evidence", icon: FileText },
    { name: "Wiki", href: "/wiki", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-xl border-r border-border/60 transform transition-transform duration-200 ease-in-out flex flex-col lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center px-6 border-b border-border/60">
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[11px] tracking-wider">CIB</span>
            </div>
            <span className="font-semibold text-[15px] tracking-tight">Company in a Box</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="micro-label text-muted-foreground px-3 pb-3">Navigation</p>
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-full transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/60">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name || ""} />
              <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="micro-label text-muted-foreground truncate !text-[10px]">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
          <div className="flex h-16 items-center justify-between px-4 lg:px-8">
            <div className="flex items-center space-x-4 flex-1 max-w-md">
              <button
                className="lg:hidden p-2 rounded-full text-muted-foreground hover:bg-secondary"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="hidden sm:block relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  className="pl-11 rounded-full bg-secondary/60 border-transparent focus-visible:ring-primary/40"
                />
                {searchOpen && searchQuery && (
                  <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-2xl shadow-xl p-3 text-sm text-muted-foreground">
                    No results for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                className="p-2 rounded-full text-muted-foreground hover:bg-secondary transition-colors"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full text-muted-foreground hover:bg-secondary transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-2xl">
                  <div className="p-2 text-sm text-muted-foreground">No notifications</div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-secondary transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name || ""} />
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium">{user?.name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex w-full" onClick={() => setSidebarOpen(false)}>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
