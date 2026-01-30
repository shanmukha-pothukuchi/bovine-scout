import type { MenuItem } from "@/components/radial-menu";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { FormStructure } from "./form";

interface ConfigContextType {
  menuTrees: Record<string, MenuItem[]>;
  setMenuTrees: React.Dispatch<
    React.SetStateAction<Record<string, MenuItem[]>>
  >;
  gamePeriods: string[];
  formStructure: FormStructure;
  setFormStructure: React.Dispatch<React.SetStateAction<FormStructure>>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [gamePeriods] = useState<string[]>([
    "Autonomous",
    "Tele-Operation",
    "End Game",
  ]);

  const defaultTree: MenuItem[] = [
    { id: "defense", label: "Defense" },
    { id: "utility", label: "Utility" },
    {
      id: "offense",
      label: "Offense",
      children: [
        {
          id: "magic",
          label: "Magic",
          children: [
            { id: "fire", label: "Fire" },
            { id: "ice", label: "Ice" },
            { id: "lightning", label: "Lightning" },
          ],
        },
        { id: "melee", label: "Melee" },
        { id: "ranged", label: "Ranged" },
      ],
    },
    { id: "support", label: "Support" },
  ];

  const [menuTrees, setMenuTrees] = useState<Record<string, MenuItem[]>>(() => {
    const trees: Record<string, MenuItem[]> = {};
    for (const period of gamePeriods) {
      trees[period] = [...defaultTree];
    }
    return trees;
  });

  const [formStructure, setFormStructure] = useState<FormStructure>({
    id: "form",
    rows: [],
  });

  return (
    <ConfigContext.Provider
      value={{
        menuTrees,
        setMenuTrees,
        gamePeriods,
        formStructure,
        setFormStructure,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}
