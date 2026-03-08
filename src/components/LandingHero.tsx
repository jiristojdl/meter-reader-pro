import { Camera, BarChart3, Clock, Cpu, Download } from "lucide-react";
import { AuthForm } from "./AuthForm";

export function LandingHero() {
  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Info box replacing camera */}
      <div className="w-full overflow-hidden rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-3 text-xl font-bold text-foreground">
          Automatické snímání displeje
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Přihlaste se pro přístup ke kameře a začněte automaticky zaznamenávat hodnoty z měřicích přístrojů pomocí AI.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-4 text-left">
          <Feature icon={Cpu} title="AI rozpoznávání" desc="Automatické čtení hodnot z displeje pomocí umělé inteligence" />
          <Feature icon={Clock} title="Periodické měření" desc="Nastavitelný interval snímání od 1 sekundy" />
          <Feature icon={BarChart3} title="Grafy v reálném čase" desc="Vizualizace naměřených dat přímo v aplikaci" />
          <Feature icon={Download} title="Export do CSV" desc="Stažení všech dat pro další zpracování" />
        </div>
      </div>

      {/* Auth form */}
      <div className="w-full rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-center text-lg font-semibold text-foreground">
          Přihlášení
        </h3>
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-muted/50 p-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
