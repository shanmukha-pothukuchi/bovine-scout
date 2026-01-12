import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useState } from "react";
import { Cell } from "./Cell";
import styles from "./index.module.css";

export function CalculationsPanel() {
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
                <Cell value="const x = 10;" />
                <Cell value="ok" />
            </div>
        </div>
    )
}