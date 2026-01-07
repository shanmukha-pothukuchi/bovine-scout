import { Outlet, useMatches } from "react-router-dom";
import type { ConfigRouteHandle } from "../../../lib/router/route-handles";
import styles from "./index.module.css";

export default function Layout() {
    const matches = useMatches();

    const currentHandle = matches.at(-1)?.handle as ConfigRouteHandle | undefined;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>{currentHandle?.title}</h3>
            </div>
            <div className={styles.body}>
                <Outlet />
            </div>
            <div className={styles.footer}>
                <p>{currentHandle?.step}</p>
            </div>
        </div>
    );
}