"use client";

export default function ComunicazioniCard() {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-extrabold text-primary mb-3 tracking-tight">
        Comunicazioni
      </h3>
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">notifications</span>
        </div>
        <p className="text-on-surface-variant text-sm font-medium">
          Nessuna nuova comunicazione
        </p>
      </div>
    </section>
  );
}
