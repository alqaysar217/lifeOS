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
    <Card className="soft-neumorphic border-none rounded-[2.5rem] group transition-all duration-500 active:scale-[0.96] hover:translate-y-[-4px] overflow-hidden">
      <div className="p-6 flex items-center gap-5">
        <div className={cn(
          "flex-shrink-0 inline-flex items-center justify-center rounded-[1.5rem] h-16 w-16 transition-all duration-500 group-hover:scale-110 shadow-sm",
          colorClass
        )}>
          <Icon className={cn("h-7 w-7", iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-black text-foreground/90 truncate">{title}</h3>
            {stat && (
              <span className="text-[11px] font-black px-3 py-1 rounded-xl bg-secondary text-primary border border-primary/5 shadow-sm">
                {stat}
              </span>
            )}
          </div>
          <p className="text-[15px] text-muted-foreground/70 font-medium truncate leading-relaxed">{description}</p>
        </div>

        <div className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-2xl bg-secondary/50 group-hover:bg-primary/10 transition-all duration-300">
          <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
}