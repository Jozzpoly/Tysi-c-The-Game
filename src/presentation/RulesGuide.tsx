import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './RulesGuide.css';

interface RulesGuideProps {
  label?: string;
  className?: string;
}

export function RulesGuide({ label = 'Jak grać', className = '' }: RulesGuideProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const dialog = open ? createPortal(
    <div className="rules-overlay" onMouseDown={() => setOpen(false)}>
      <section
        className="rules-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-guide-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="rules-dialog-header">
          <div>
            <div className="eyebrow">Wariant stołu · PlayOK / Kurnik · 3 graczy</div>
            <h2 id="rules-guide-title">Tysiąc w 60 sekund</h2>
          </div>
          <button className="ghost rules-close" onClick={() => setOpen(false)} aria-label="Zamknij zasady">×</button>
        </header>

        <div className="rules-grid">
          <section className="rules-block">
            <h3>Cel i karty</h3>
            <p>Jako pierwszy osiągnij co najmniej <strong>1000 punktów</strong>.</p>
            <p><strong>Siła kart:</strong> A &gt; 10 &gt; K &gt; Q &gt; J &gt; 9.</p>
            <p><strong>Punkty:</strong> A=11 · 10=10 · K=4 · Q=3 · J=2 · 9=0.</p>
          </section>

          <section className="rules-block">
            <h3>Licytacja i musik</h3>
            <p>Licytujesz wynik, który zobowiązujesz się zdobyć, jeśli zostaniesz grającym. Stawki rosną co 10.</p>
            <p>Zwycięzca bierze 3 karty z musika, a potem oddaje po jednej karcie każdemu rywalowi. Wszyscy kończą z 8 kartami.</p>
          </section>

          <section className="rules-block">
            <h3>Kontrakt i lewy</h3>
            <p>Po wymianie ustalasz ostateczny kontrakt — nie niższy niż wygrana stawka. Jeśli go nie zrealizujesz, tracisz jego wartość.</p>
            <p>Rozdanie ma 8 lew. W tym wariancie: dołóż do koloru; jeśli możesz, przebij wyższą kartą tego koloru; bez koloru zagraj atut; jeśli atut już leży i masz wyższy, przebij go.</p>
          </section>

          <section className="rules-block">
            <h3>Meldunek = punkty + atut</h3>
            <p>Masz K+Q jednego koloru i wychodzisz jedną z nich? Możesz zameldować. Ten kolor natychmiast staje się atutem.</p>
            <p className="marriage-values"><span>♠ 40</span><span>♣ 60</span><span>♦ 80</span><span>♥ 100</span></p>
          </section>

          <section className="rules-block">
            <h3>Jak czytać stół</h3>
            <p><strong>Stawka</strong> = aktualna wygrana licytacji. <strong>Kontrakt</strong> = ostateczne zobowiązanie grającego. <strong>Atut</strong> = kolor przebijający pozostałe.</p>
            <p>Po każdej lewie i każdym rozdaniu gra pokazuje, kto zdobył punkty i dlaczego.</p>
          </section>

          <section className="rules-block">
            <h3>800 i rzadsze reguły</h3>
            <p>Od 800 punktów wynik rośnie tylko wtedy, gdy jesteś grającym. Bomba i cztery dziewiątki pojawią się w interfejsie tylko wtedy, gdy możesz z nich skorzystać.</p>
            <p className="rules-note">Tysiąc ma kilka popularnych odmian. Ten stół konsekwentnie używa wariantu PlayOK/Kurnik dla 3 graczy.</p>
          </section>
        </div>

        <footer className="rules-dialog-footer">
          <button className="primary" onClick={() => setOpen(false)}>Wracam do stołu</button>
        </footer>
      </section>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button className={`ghost rules-trigger ${className}`.trim()} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {label}
      </button>
      {dialog}
    </>
  );
}
