import { IconChevronsLeft } from "@tabler/icons-react";
import { Cell } from "./Cell";
import styles from "./index.module.css";

export default function Analysis() {
    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.top_bar}>
                    <div></div>
                    <span className={styles.sidebar_collapse}>
                        <IconChevronsLeft className={styles.icon} />
                    </span>
                </div>
                <div className={styles.cells}>
                    <Cell />
                    <Cell />
                </div>
            </div>
        </div>
    )
}