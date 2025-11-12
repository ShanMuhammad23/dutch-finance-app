"use client";

import { Card } from "@/components/card";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const RoomOccupancyChart = dynamic(
  () => import("recharts").then((mod) => {
    const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = mod;
    
    return function RoomOccupancy({ className }: { className?: string }) {
      const data = [
        { name: "Occupied", value: 85 },
        { name: "Available", value: 15 },
      ];

      const COLORS = ["#0088FE", "#00C49F"];

      return (
        <Card className={cn("p-6", className)}>
          <h3 className="mb-4 text-lg font-medium">Room Occupancy</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      );
    };
  }),
  { ssr: false }
);

export { RoomOccupancyChart as RoomOccupancy }; 