import styles from "./index.module.css";

export default function FormEditor() {
    return (
        <div className={styles.container}>
            <div className={styles.left_sidebar}></div>
            <div className={styles.main}></div>
            <div className={styles.right_sidebar}></div>
        </div>
    );
}