import styles from './MiniReport.module.css'

export default function MiniReport() {
	const total = 2
	const complete = 1
	return (
		<section className={styles.section}>
			<div className={styles.total}>
				<div>Total Tasks</div>
				<div className={styles.value}>{total}</div>
			</div>
			<div className={styles.complete}>
				<div>Completed</div>
				<div className={styles.value}>{complete} of {total}</div>
			</div>
		</section>
	)
}
