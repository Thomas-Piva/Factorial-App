import Link from "next/link";

interface QuickCard {
  href: string;
  icon: string;
  label: string;
  description: string;
}

const CARDS: QuickCard[] = [
  {
    href: "/turni",
    icon: "calendar_month",
    label: "Turni",
    description: "Gestisci e pubblica i turni settimanali",
  },
  {
    href: "/assenze",
    icon: "event_busy",
    label: "Assenze",
    description: "Visualizza e registra le assenze del team",
  },
  {
    href: "/persone",
    icon: "group",
    label: "Persone",
    description: "Elenco dei dipendenti del negozio",
  },
];

export default function HubPage() {
  return (
    <div data-testid="hub-page" className="px-6 pt-8 pb-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-extrabold text-primary tracking-tighter mb-8">
        Hub
      </h1>

      <div className="flex flex-col gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-4 bg-surface-container-lowest rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow"
            aria-label={card.label}
          >
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">
                {card.icon}
              </span>
            </div>
            <div>
              <p className="text-lg font-bold text-on-surface">{card.label}</p>
              <p className="text-sm text-on-surface-variant">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
