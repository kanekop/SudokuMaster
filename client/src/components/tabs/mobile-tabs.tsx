import { Link, useLocation } from "wouter";
import { Grid, History, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileTabs() {
  const [location] = useLocation();

  const tabs = [
    {
      path: "/game",
      label: "ゲーム",
      icon: <Grid className="h-5 w-5" />,
    },
    {
      path: "/history",
      label: "履歴",
      icon: <History className="h-5 w-5" />,
    },
    {
      path: "/friends",
      label: "友達",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg z-40">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <Link 
            key={tab.path} 
            href={tab.path}
            className={cn(
              "flex flex-col items-center py-2 px-4",
              location === tab.path
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {tab.icon}
            <span className="text-xs mt-1">{tab.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
