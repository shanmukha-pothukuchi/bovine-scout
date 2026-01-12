import { IconGeometry, IconMathFunction } from "@tabler/icons-react";
import { useState } from "react";
import { BuilderPanel } from "./BuilderPanel";
import { CalculationsPanel } from "./CalculationsPanel";
import styles from "./index.module.css";

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