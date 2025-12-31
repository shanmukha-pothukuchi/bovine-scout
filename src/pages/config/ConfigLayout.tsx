import { Outlet } from "react-router-dom";
import styles from "./layout.module.css";

export default function ConfigLayout() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
            </div>
            <div className={styles.body}>
                <Outlet />
            </div>
            <div className={styles.footer}>
            </div>
        </div>
    );
}