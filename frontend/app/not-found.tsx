import styles from './NotFound.module.css'

export default async function NotFound() {
	return (
		<main className={styles.main}>
			<span className={styles.first}>ARE </span>
			<span className={styles.second}>YOU </span>
			<span className={styles.third}>LOST?</span>
		</main>
	)
}
