import styles from './page.module.css'

export default function Home() {
    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <div className={styles.glowOrb} />

                <h1 className={styles.title}>
                    <span className="gradient-text">AssurManager</span>
                </h1>
                <p className={styles.subtitle}>Le Défi IARD</p>

                <p className={styles.description}>
                    Prenez les commandes d&apos;une compagnie d&apos;assurance IARD et naviguez
                    dans un marché en constante évolution. Gérez vos produits, anticipez
                    les risques climatiques et faites face à la concurrence.
                </p>

                <div className={styles.features}>
                    <div className={`${styles.featureCard} glass`}>
                        <span className={styles.featureIcon}>🏢</span>
                        <h3>18 Compagnies</h3>
                        <p>Choisissez parmi 18 compagnies avec des caractéristiques uniques</p>
                    </div>

                    <div className={`${styles.featureCard} glass`}>
                        <span className={styles.featureIcon}>📊</span>
                        <h3>Multi-Produits</h3>
                        <p>Gérez Auto, MRH et arbitrez entre vos différentes lignes</p>
                    </div>

                    <div className={`${styles.featureCard} glass`}>
                        <span className={styles.featureIcon}>⚡</span>
                        <h3>Décisions Stratégiques</h3>
                        <p>Tarification, RH, IT, prévention... chaque choix compte</p>
                    </div>
                </div>

                <button className={styles.ctaButton}>
                    Commencer une partie
                </button>
            </div>
        </main>
    )
}
