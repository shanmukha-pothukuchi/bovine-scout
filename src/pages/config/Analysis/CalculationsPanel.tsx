import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useState } from "react";
import { Cell } from "./Cell";


export function CalculationsPanel() {
    const [calculationContext, setCalculationContext] = useState<string | null>("match");

    const calculationContexts = new Map([
        ["match", "Match"],
        ["team", "Team"],
        ["pick_list", "Pick List"],
    ]);

    return (
        <div className="flex-1">
            <div className="m-2">
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
            <div>
                <Cell value="const x = 10;" onChange={() => { }} />
                <Cell value="ok" onChange={() => { }} />
            </div>
        </div>
    )
}