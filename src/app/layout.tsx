import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'AssurManager - Le Défi IARD',
    description: 'Serious game de simulation de compagnie d\'assurance IARD',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr">
            <body>
                {children}
            </body>
        </html>
    )
}
