"use client";

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, RotateCcw } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 mb-6">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/">
              <Button size="lg" className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </Button>

          <Button variant="outline" onClick={() => window.history.back()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Go Back
          </Button>

          <Button variant="ghost" asChild>
            <Link to="/search">
              <Button>Search Pages</Button>
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            If you think this is a mistake, please{" "}
            <a href="mailto:support@companyinabox.com" className="text-primary-600 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}