import ReportsClient from "@/components/reports-client"

export default function InformesPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Informes y Analíticas</h1>
                <p className="text-muted-foreground">
                    Visualiza el rendimiento de tu tienda y toma decisiones informadas.
                </p>
            </div>
            <ReportsClient />
        </div>
    )
}
