import { Camera, BarChart3, Clock, Cpu, Download, Settings, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center gap-3 py-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h1 className="font-mono text-sm font-bold tracking-tight text-foreground">
              O aplikaci
            </h1>
          </div>
        </div>
      </header>

      <main className="container flex-1 space-y-6 py-6">
        <section>
          <h2 className="mb-3 text-2xl font-bold text-foreground">Opisovač Displeje</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Aplikace pro automatické snímání a zaznamenávání hodnot z měřicích přístrojů pomocí
            kamery a umělé inteligence. Stačí namířit kameru na displej přístroje a aplikace
            automaticky rozpozná a zaznamená zobrazené hodnoty v nastaveném intervalu.
          </p>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Funkce</h3>
          <div className="space-y-3">
            <FeatureCard
              icon={Cpu}
              title="AI rozpoznávání textu"
              desc="Aplikace využívá pokročilé modely umělé inteligence pro přesné čtení hodnot z displejů měřicích přístrojů. AI automaticky detekuje čísla, jednotky a popisky."
            />
            <FeatureCard
              icon={Camera}
              title="Automatická kalibrace"
              desc="Při spuštění měření AI nejprve analyzuje displej a automaticky identifikuje všechny zobrazené hodnoty. Vytvoří odpovídající sloupce pro záznam dat."
            />
            <FeatureCard
              icon={Clock}
              title="Periodické snímání"
              desc="Nastavte interval snímání (od 1 sekundy) a volitelně celkovou dobu měření. Aplikace bude automaticky zaznamenávat hodnoty v pravidelných intervalech."
            />
            <FeatureCard
              icon={BarChart3}
              title="Vizualizace dat"
              desc="Naměřená data si můžete zobrazit v interaktivním grafu přímo v aplikaci. Graf zobrazuje časový průběh všech zaznamenaných veličin."
            />
            <FeatureCard
              icon={Download}
              title="Export do CSV"
              desc="Všechna naměřená data lze jedním kliknutím exportovat do souboru CSV pro další zpracování v Excelu nebo jiných nástrojích."
            />
            <FeatureCard
              icon={Settings}
              title="Konfigurace sloupců"
              desc="Můžete přidávat, odebírat a přejmenovávat měřené veličiny. Sloupce se při kalibraci vytvoří automaticky, ale lze je kdykoli upravit."
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Jak začít</h3>
          <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
            <li>Přihlaste se pomocí e-mailu a hesla nebo přes Google účet</li>
            <li>Povolte přístup ke kameře a namiřte ji na displej přístroje</li>
            <li>Nastavte interval snímání a volitelně dobu měření</li>
            <li>Stiskněte <strong className="text-foreground">Start</strong> – AI provede kalibraci a začne měřit</li>
            <li>Sledujte data v tabulce nebo v grafu v reálném čase</li>
            <li>Po dokončení exportujte data do CSV</li>
          </ol>
        </section>
      </main>
    </div>
  );
};

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default About;
