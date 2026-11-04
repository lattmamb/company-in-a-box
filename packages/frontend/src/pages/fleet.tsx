import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Eye, Wrench, Settings, MapPin, Calendar, Zap } from "lucide-react";

export function Fleet() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fuelFilter, setFuelFilter] = useState("all");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500 mt-1">Manage your vehicle fleet</p>
        </div>
      </div>
      <Tabs defaultValue="vehicles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="charging">Charging</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Vehicles</CardTitle>
                  <CardDescription>Manage your fleet vehicles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>No vehicles yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bookings" className="mt-6">
          <Card>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>No bookings yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>No maintenance records yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="charging" className="mt-6">
          <Card>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <p>Charging infrastructure management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
