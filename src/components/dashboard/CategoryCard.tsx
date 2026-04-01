"use client"

import { LucideIcon, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  stat?: string;
}

export function CategoryCard({ title, description, icon: Icon, stat }: CategoryCardProps) {
  return (
    <Card className="rounded-[10px] border-none bg-white premium-shadow inner-highlight overflow-hidden transition-all active:scale-[0.99] group">
      <div className="p-4 flex items-center gap-4">
        {/* Unified Icon Style */}
        <div className="h-12 w-12 rounded-[10px] soft-purple-bg flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-foreground truncate">{title}</h3>
            {stat && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-[6px] bg-secondary text-primary border border-primary/5">
                {stat}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">{description}</p>
        </div>

        <div className="h-8 w-8 rounded-[8px] bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
          <ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
}
