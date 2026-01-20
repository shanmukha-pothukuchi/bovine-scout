import { IconGeometry, IconMathFunction } from "@tabler/icons-react";
import { useState } from "react";
import { BuilderPanel } from "./BuilderPanel";
import { CalculationsPanel } from "./CalculationsPanel";


export default function Analysis() {
    const panels = {
        "calculations": { icon: IconMathFunction },
        "builder": { icon: IconGeometry },
    } as const;

    const [activeSidebarPanel, setActiveSidebarPanel] = useState<keyof typeof panels>("calculations");

    return (
        <div className="h-full flex">
            <div className="w-[500px] h-full bg-sidebar border-r border-border overflow-y-auto flex">
                <div className="p-2 flex flex-col items-center gap-2 bg-secondary border-r border-border">
                    {Object.entries(panels).map(([key, { icon: Icon }], i) =>
                        <span
                            key={i}
                            className={`flex justify-center items-center rounded-md min-w-8 min-h-8 max-w-8 max-h-8 cursor-pointer hover:bg-accent
                            ${activeSidebarPanel == key && "bg-accent"}`}
                            onClick={() => setActiveSidebarPanel(key as keyof typeof panels)}
                        >
                            <Icon className="opacity-50 w-5" />
                        </span>
                    )}
                </div>
                {activeSidebarPanel == "calculations" && <CalculationsPanel />}
                {activeSidebarPanel == "builder" && <BuilderPanel />}
            </div>
        </div>
    )
}