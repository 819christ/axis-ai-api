import { Link } from 'react-router-dom';
import { AxisLogo } from '../components/AxisLogo';
import { Code2, Terminal, Briefcase, Globe, Shield, MessageCircle, Sparkles } from 'lucide-react';

// Note : aucun prix de modèle, aucun nom de modèle OpenRouter n'est affiché ici
// conformément à la politique de la plateforme

const TIERS = [
  { id: 1, name: 'Starter',    priceXof: '1 500',  priceUsd: 2.50,  popular: false },
  { id: 2, name: 'Basic',      priceXof: '3 000',  priceUsd: 5.00,  popular: false },
  { id: 3, name: 'Standard',   priceXof: '6 000',  priceUsd: 10.00, popular: false },
  { id: 4, name: 'Pro',        priceXof: '12 000', priceUsd: 20.00, popular: true  },
  { id: 5, name: 'Expert',     priceXof: '18 000', priceUsd: 30.00, popular: false },
  { id: 6, name: 'Master',     priceXof: '24 000', priceUsd: 40.00, popular: false },
  { id: 7, name: 'Enterprise', priceXof: '30 000', priceUsd: 50.00, popular: false },
];

const TIER_DESCS = [
  "Idéal pour découvrir la plateforme avec des modèles d'IA accessibles.",
  "Pour un usage quotidien léger : rédaction, résumé, assistance.",
  "Polyvalent — coding, analyse, traduction et rédaction avancée.",
  "Le choix des développeurs exigeants pour des projets professionnels.",
  "Applications intensives avec contexte long et haute précision.",
  "Raisonnement complexe, logique avancée et tâches multi-étapes lourdes.",
  "Accès complet sans restriction aux plus puissants modèles mondiaux.",
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
              Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA
            </span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 80 }} className="ax-fade-in">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <AxisLogo size={76} className="ax-pulse-glow" />
          </div>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            La passerelle d'API IA unifiée en Francs CFA
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--axis-textMuted)', maxWidth: 740, margin: '0 auto 34px', lineHeight: 1.6 }}>
            Une seule clé API standard pour accéder à tous les grands modèles d'IA du marché.<br />
            Payez simplement par <b>Mobile Money (MTN / Moov)</b> dès <b>1 500 FCFA</b>.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              Créer une clé API gratuitement
            </Link>
            <a href="#tarifs" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>
              Voir les 7 Forfaits
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
            <span className="badge badge-green" style={{ marginBottom: 12 }}>7 FORFAITS DE 1 500 XOF À 30 000 XOF</span>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Tarification Transparente en Francs CFA (XOF)</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 14, maxWidth: 680, margin: '0 auto' }}>
              Des forfaits pensés pour le marché béninois et la sous-région, avec validation instantanée par Mobile Money ou modérateur local.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, textAlign: 'left' }}>
            {TIERS.map((tier, i) => (
              <div key={tier.id} className="card card-hover" style={{
                border: tier.popular ? '2px solid var(--axis-accent)' : '1px solid var(--axis-border)',
                position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: tier.popular ? 'linear-gradient(180deg, rgba(132,204,22,0.06) 0%, var(--axis-sidebar) 100%)' : 'var(--axis-sidebar)'
              }}>
                {tier.popular && (
                  <span style={{ position: 'absolute', top: -12, right: 18, background: 'var(--axis-accent)', color: '#131314', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                    POPULAIRE
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 700 }}>Palier {tier.id}</h3>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
                  </div>

                  {/* Prix en XOF au premier plan */}
                  <div style={{ fontSize: 30, fontWeight: 900, marginTop: 4 }}>
                    {tier.priceXof} <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
                  </div>
                  <div style={{ color: 'var(--axis-textMuted)', fontSize: 12, marginBottom: 18 }}>
                    Durée : 30 jours
                  </div>

                  <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 22, minHeight: 40 }}>
                    {TIER_DESCS[i]}
                  </p>
                </div>

                <Link to="/auth" className={tier.popular ? "btn-primary" : "btn-ghost"} style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                  Choisir ce forfait
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
              Réglez en Francs CFA via Mobile Money et activez votre accès en quelques instants :
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
          <span>30 jours</span>
        </div>
      </footer>
    </div>
  );
};
