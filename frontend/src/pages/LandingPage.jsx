import { Link } from 'react-router-dom';
import { AxisLogo } from '../components/AxisLogo';
import { Code2, Terminal, Briefcase, Globe, Shield, MessageCircle, Sparkles } from 'lucide-react';

// Note : aucun prix de modèle, aucun nom de modèle OpenRouter n'est affiché ici
// conformément à la politique de la plateforme

const TIERS = [
  { id: 1, family: 'Étudiant & Découverte', name: 'Starter Light', priceXof: '1 500', creditUsd: '1.50', description: 'Pour les résumés, la rédaction et les petits workflows.' },
  { id: 2, family: 'Étudiant & Découverte', name: 'Starter Standard', priceXof: '2 500', creditUsd: '2.50', description: 'Pour un usage régulier de chatbots et de traduction.' },
  { id: 3, family: 'Étudiant & Découverte', name: 'Starter Plus', priceXof: '4 500', creditUsd: '4.50', description: 'Pour tester des scripts simples et de petits contextes.' },
  { id: 4, family: 'Pro & Automatisation', name: 'Pro Starter', priceXof: '7 500', creditUsd: '7.50', description: 'Pour quelques micro-automatisations par jour.' },
  { id: 5, family: 'Pro & Automatisation', name: 'Pro Standard', priceXof: '12 000', creditUsd: '12.00', description: 'Pour le code et des mini-agents réguliers.' },
  { id: 6, family: 'Pro & Automatisation', name: 'Pro Advanced', priceXof: '18 000', creditUsd: '18.00', description: 'Pour des flux d’automatisation plus intensifs.' },
  { id: 7, family: 'Entreprise & Scale', name: 'Business Light', priceXof: '22 000', creditUsd: '22.00', description: 'Pour une agence ou startup en phase de production.' },
  { id: 8, family: 'Entreprise & Scale', name: 'Business Standard', priceXof: '26 000', creditUsd: '26.00', description: 'Pour des agents autonomes et des processus soutenus.' },
  { id: 9, family: 'Entreprise & Scale', name: 'Business Ultimate', priceXof: '30 000', creditUsd: '30.00', description: 'Pour les requêtes complexes et l’ingénierie avancée.' },
];

export const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="ax-hex-bg">
      {/* Header */}
      <header style={{ padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--axis-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(19,19,20,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AxisLogo size={28} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>Axis AI</span>
          <span className="badge badge-green" style={{ fontSize: 10 }}>BÉNIN / UEMOA</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/auth" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}>Connexion</Link>
          <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>S'inscrire</Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: '50px 20px 80px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        {/* Bannière nationale */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderRadius: 999, background: 'linear-gradient(90deg, rgba(132,204,22,0.15) 0%, rgba(192,132,252,0.15) 100%)', border: '1px solid rgba(132,204,22,0.4)' }}>
            <Sparkles size={15} color="var(--axis-accent)" />
            <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
              Axis AI, une passerelle IA pay-as-you-go en Francs CFA
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }} className="ax-fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AxisLogo size={76} className="ax-pulse-glow" />
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Votre passerelle API IA, payée au crédit consommé
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--axis-textMuted)', maxWidth: 740, margin: '0 auto 34px', lineHeight: 1.6 }}>
            Une clé API standard pour utiliser un catalogue sélectionné de modèles IA.<br />
            Rechargez par <b>Mobile Money (MTN / Moov)</b> à partir de <b>1 500 FCFA</b>.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              Créer mon compte
            </Link>
            <a href="#tarifs" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>
              Voir les 9 packs
            </a>
          </div>
        </div>

        {/* Section Compatibilité IDE */}
        <section style={{ marginBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Compatible avec tous vos outils de développement</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 14 }}>Une clé API standard — prête à l'emploi dans Cursor, Claude Code, VS Code ou vos scripts.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: Terminal,  title: 'Claude Code',        desc: "L'agent CLI d'Anthropic avec support Axis Proxy" },
              { icon: Code2,     title: 'Cursor & Windsurf',  desc: "Autocomplétion et chat en direct avec les IA" },
              { icon: Briefcase, title: "VS Code & Continue", desc: "Extension IA native dans votre éditeur favori" },
              { icon: Globe,     title: 'Web & Scripts',       desc: "Compatible SDK OpenAI standard (Python, TS, cURL)" },
            ].map((tool, i) => (
              <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <tool.icon size={20} color="var(--axis-accent)" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{tool.title}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section Tarifs — SANS prix de modèles ni noms OpenRouter */}
        <section id="tarifs" style={{ marginBottom: 100 }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <span className="badge badge-green" style={{ marginBottom: 12 }}>9 PACKS DE 1 500 XOF À 30 000 XOF</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Un portefeuille IA, sans expiration</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 14, maxWidth: 680, margin: '0 auto' }}>
              Achetez un pack en FCFA, recevez le crédit USD correspondant après validation, puis utilisez-le à votre rythme.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12, textAlign: 'left' }}>
            {TIERS.map((pack) => (
              <div key={pack.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <span className="badge badge-gray" style={{ alignSelf: 'flex-start', fontSize: 9 }}>{pack.family}</span>
                <h3 style={{ fontSize: 17, fontWeight: 750 }}>{pack.name}</h3>
                <p style={{ minHeight: 37, fontSize: 12, color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>{pack.description}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                  <b style={{ fontSize: 22 }}>{pack.priceXof} <span style={{ fontSize: 12, color: 'var(--axis-accent)' }}>FCFA</span></b>
                  <span style={{ fontSize: 12, color: 'var(--axis-accent)', fontWeight: 700 }}>${pack.creditUsd} crédit</span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--axis-muted)' }}>Paiement unique · aucun délai d’expiration</div>
                <Link to="/auth" className="btn-ghost" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', padding: '8px 12px' }}>
                  Découvrir ce pack
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Section Paiement Local */}
        <section style={{ padding: '36px 32px', borderRadius: 20, border: '1px solid var(--axis-border)', background: 'linear-gradient(135deg, rgba(30,31,32,0.9) 0%, rgba(19,19,20,0.95) 100%)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Paiement Local & Validation Instantanée</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 28 }}>
              Réglez en Francs CFA via Mobile Money. Votre crédit est ajouté après validation du paiement :
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ padding: 20, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <MessageCircle size={20} color="#25D366" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Option A : Contact WhatsApp Admin</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Envoyez votre virement Mobile Money (MTN / Moov Bénin) et transmettez la capture WhatsApp. Validation sous <b>24h</b>.
                </p>
                <span className="badge badge-green">MTN & Moov Bénin</span>
              </div>
              <div style={{ padding: 20, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Shield size={20} color="var(--axis-purple)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Option B : Agent Modérateur (MOD-XXXX)</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Vous avez un modérateur de proximité ? Il encaisse et valide directement — <b>activation immédiate</b>.
                </p>
                <span className="badge badge-purple">Activation Immédiate</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--axis-border)', padding: '28px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--axis-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AxisLogo size={20} />
          <span>Axis AI © 2025 · Première passerelle IA béninoise en Francs CFA</span>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          <span>1 500 à 30 000 XOF</span>
          <span>Mobile Money</span>
          <span>Crédit sans échéance</span>
        </div>
      </footer>
    </div>
  );
};
