"use client";

import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const RentCollectionChart = dynamic(
  () => import("recharts").then((mod) => {
    const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
    
    return function RentCollection({ className, timeFrame }: { className?: string; timeFrame?: string }) {
      const data = [
        { name: "Jan", rent: 4000, pending: 1000 },
        { name: "Feb", rent: 4500, pending: 1200 },
        { name: "Mar", rent: 5000, pending: 800 },
        { name: "Apr", rent: 4800, pending: 900 },
        { name: "May", rent: 5200, pending: 700 },
        { name: "Jun", rent: 5500, pending: 600 },
      ];

      return (
        <Card className={cn("p-6", className)}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">Rent Collection Overview</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Time Frame:</span>
              <select className="rounded-md border border-gray-200 px-2 py-1 text-sm">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="rent" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      );
    };
  }),
  { ssr: false }
);

export { RentCollectionChart as RentCollection }; 