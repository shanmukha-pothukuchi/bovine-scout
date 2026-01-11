import { IconGeometry, IconMathFunction } from "@tabler/icons-react";
import { Cell } from "./Cell";
import styles from "./index.module.css";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useState } from "react";

export default function Analysis() {
    const panels = {
        "calculations": { icon: IconMathFunction },
        "builder": { icon: IconGeometry },
    } as const;

    const [activeSidebarPanel, setActiveSidebarPanel] = useState<keyof typeof panels>("calculations");

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.strip}>
                    {Object.entries(panels).map(([key, { icon: Icon }], i) =>
                        <span
                            key={i}
                            className={`${styles.icon_container}
                            ${activeSidebarPanel == key && styles.active}`}
                            onClick={() => setActiveSidebarPanel(key as keyof typeof panels)}
                        >
                            <Icon className={styles.icon} />
                        </span>
                    )}
                </div>
                {activeSidebarPanel == "calculations" && <CalculationsPanel />}
                {activeSidebarPanel == "builder" && <BuilderPanel />}
            </div>
        </div>
    )
}

function CalculationsPanel() {
    const [calculationContext, setCalculationContext] = useState<string | null>("match");

    const calculationContexts = new Map([
        ["match", "Match"],
        ["team", "Team"],
        ["pick_list", "Pick List"],
    ]);

    return (
        <div className={styles.calculations_panel}>
            <div className={styles.top_bar}>
                <Select
                    value={calculationContext}
                    onValueChange={setCalculationContext}
                >
                    <SelectTrigger>
                        <SelectValue>
                            {calculationContexts.get(calculationContext ?? "") ?? "Select calculation type"}
                        </SelectValue>
                    </SelectTrigger>

                    <SelectContent align="start">
                        {Array.from(calculationContexts.entries()).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className={styles.cells}>
                <Cell />
                <Cell />
            </div>
        </div>
    )
}

function BuilderPanel() {
    return (
        <div className={styles.builder_panel}>
            Builder Panel
        </div>
    )
}