"use client"

import { LucideIcon, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  iconColor: string;
  stat?: string;
}

export function CategoryCard({ title, description, icon: Icon, colorClass, iconColor, stat }: CategoryCardProps) {
  return (
    <Card className="premium-shadow border-none rounded-[2rem] group transition-all duration-300 active:scale-[0.97] hover:bg-white/80">
      <div className="p-5 flex items-center gap-4">
        <div className={cn("flex-shrink-0 inline-flex items-center justify-center rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110", colorClass)}>
          <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <h3 className="text-lg font-bold text-foreground truncate">{title}</h3>
            {stat && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {stat}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate leading-relaxed">{description}</p>
        </div>

        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-muted/30 group-hover:bg-primary/10 transition-colors">
          <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
}