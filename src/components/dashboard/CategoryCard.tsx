"use client"

import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  iconColor: string;
}

export function CategoryCard({ title, description, icon: Icon, colorClass, iconColor }: CategoryCardProps) {
  return (
    <Card className="glass-card group relative overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
      <div className="p-5">
        <div className={cn("inline-flex items-center justify-center rounded-2xl p-3 mb-4 transition-transform duration-300 group-hover:rotate-12", colorClass)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}