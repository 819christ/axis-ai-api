import { Link } from 'react-router-dom';
import { AxisLogo } from '../components/AxisLogo';
import { Code2, Terminal, Briefcase, Globe, Shield, MessageCircle, Zap, Sparkles } from 'lucide-react';

const TIERS = [
  { id: 1, name: 'Starter', priceXof: '1 500', priceUsd: 2.50, budgetUsd: 2.50, maxCost: 5.00, desc: 'Modèles gratuits & ultra-légers (Llama 3.3 Free, Gemini Flash Free)' },
  { id: 2, name: 'Basic', priceXof: '3 000', priceUsd: 5.00, budgetUsd: 5.00, maxCost: 10.00, desc: 'Modèles rapides du quotidien (GPT-4o Mini, Gemini 2.0 Flash, Mistral Small)' },
  { id: 3, name: 'Standard', priceXof: '6 000', priceUsd: 10.00, budgetUsd: 10.00, maxCost: 15.00, desc: 'Polyvalent & coding (DeepSeek V3, Claude 3 Haiku, Qwen 2.5 Coder)' },
  { id: 4, name: 'Pro', priceXof: '12 000', priceUsd: 20.00, budgetUsd: 20.00, maxCost: 20.00, desc: 'Modèles de pointe pour développeurs exigeants (Claude 3.5 Sonnet, GPT-4o)', popular: true },
  { id: 5, name: 'Expert', priceXof: '18 000', priceUsd: 30.00, budgetUsd: 30.00, maxCost: 25.00, desc: 'Haute performance et contexte étendu pour applications intensives' },
  { id: 6, name: 'Master', priceXof: '24 000', priceUsd: 40.00, budgetUsd: 40.00, maxCost: 30.00, desc: 'Modèles de raisonnement avancé et logique lourde (DeepSeek R1, OpenAI o1-mini)' },
  { id: 7, name: 'Enterprise', priceXof: '30 000', priceUsd: 50.00, budgetUsd: 50.00, maxCost: 35.00, desc: 'Accès illimité sans restriction aux plus gros modèles mondiaux' },
];

export const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="ax-hex-bg">
      {/* Header */}
      <header style={{ padding: '18px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--axis-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(19,19,20,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AxisLogo size={28} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--axis-text)' }}>Axis AI</span>
          <span className="badge badge-green" style={{ fontSize: 10 }}>BÉNIN / UEMOA</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/auth" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}>Connexion</Link>
          <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>S'inscrire</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '50px 20px 80px', textAlign: 'center', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        {/* BANNIÈRE VALEUR AJOUTÉE FORTE */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 22px', borderRadius: 999,
          background: 'linear-gradient(90deg, rgba(132,204,22,0.15) 0%, rgba(192,132,252,0.15) 100%)',
          border: '1px solid rgba(132,204,22,0.4)', marginBottom: 28, maxWidth: '90%'
        }}>
          <Sparkles size={16} color="var(--axis-accent)" />
          <span style={{ fontSize: 'clamp(12px, 2vw, 14px)', fontWeight: 700, color: 'var(--axis-text)' }}>
            Axis AI, la toute première plateforme béninoise offrant les modèles d'IA mondiaux à des prix abordables en Francs CFA
          </span>
        </div>

        <div style={{ marginBottom: 70 }} className="ax-fade-in">
          <div style={{ margin: '0 auto 20px', display: 'flex', justifyContent: 'center' }}>
            <AxisLogo size={76} className="ax-pulse-glow" />
          </div>

          <h1 style={{ fontSize: 'clamp(34px, 5vw, 54px)', fontWeight: 800, marginBottom: 18, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            La passerelle d'API IA unifiée en Francs CFA
          </h1>
          <p style={{ fontSize: 'clamp(15px, 2vw, 19px)', color: 'var(--axis-textMuted)', maxWidth: 740, margin: '0 auto 34px', lineHeight: 1.6 }}>
            Accédez à Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3 et Gemini via <b>une seule clé API standard</b>. Payez simplement par Mobile Money (MTN / Moov) dès <b>1 500 FCFA</b>.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              Créer une clé API gratuitement
            </Link>
            <a href="#tarifs" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>
              Voir les 7 Paliers (1 500 à 30 000 FCFA)
            </a>
          </div>
        </div>

        {/* Section Intégration IDE */}
        <section style={{ marginBottom: 100 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>Compatible immédiatement avec tous vos IDE</h2>
          <p style={{ color: 'var(--axis-textMuted)', marginBottom: 36, fontSize: 14 }}>
            Une seule clé API standard OpenAI — insérez-la dans Cursor, Claude Code, Windsurf ou vos applications web.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: Terminal, title: 'Claude Code', desc: 'L’agent CLI d’Anthropic avec support Axis Proxy' },
              { icon: Code2, title: 'Cursor & Windsurf', desc: 'Autocomplétion & chat en direct avec les modèles autorisés' },
              { icon: Briefcase, title: 'VS Code & Continue', desc: 'Routage automatique selon la complexité du prompt' },
              { icon: Globe, title: 'Web, Mobile & Scripts', desc: 'Compatible avec le SDK OpenAI standard (Python, TS, cURL)' },
            ].map((tool, i) => (
              <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <tool.icon size={20} color="var(--axis-accent)" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{tool.title}</h3>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section Tarifs 7 Paliers XOF (1 500 à 30 000 FCFA) */}
        <section id="tarifs" style={{ marginBottom: 100 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--axis-accent)' }}>7 PALIERS DE 1 500 XOF À 30 000 XOF</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 10 }}>Tarification Transparente en Francs CFA (XOF)</h2>
          <p style={{ color: 'var(--axis-textMuted)', marginBottom: 40, fontSize: 14, maxWidth: 700, margin: '0 auto 40px' }}>
            Des forfaits pensés pour le marché béninois et la sous-région, avec validation instantanée par Mobile Money ou modérateur local.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, textAlign: 'left' }}>
            {TIERS.map(tier => (
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

                  {/* Prix XOF mis en avant */}
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--axis-text)', marginTop: 4 }}>
                    {tier.priceXof} <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--axis-accent)' }}>FCFA</span>
                  </div>
                  <div style={{ color: 'var(--axis-textMuted)', fontSize: 12, marginBottom: 16 }}>
                    ≈ ${tier.priceUsd.toFixed(2)} USD / 30 jours
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--axis-textMuted)', marginBottom: 18, minHeight: 34, lineHeight: 1.4 }}>{tier.desc}</p>

                  <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 12, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--axis-textMuted)' }}>Budget alloué :</span>
                      <b>${tier.budgetUsd.toFixed(2)} USD</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--axis-textMuted)' }}>Plafond modèle :</span>
                      <b style={{ color: 'var(--axis-accent)' }}>≤ ${tier.maxCost.toFixed(2)} / 1M</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--axis-textMuted)' }}>Durée de vie :</span>
                      <span>30 jours stricts</span>
                    </div>
                  </div>
                </div>

                <Link to="/auth" className={tier.popular ? "btn-primary" : "btn-ghost"} style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}>
                  Choisir ce palier
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Section Paiement Local */}
        <section style={{ padding: '36px 32px', borderRadius: 20, border: '1px solid var(--axis-border)', background: 'linear-gradient(135deg, rgba(30,31,32,0.9) 0%, rgba(19,19,20,0.95) 100%)', textAlign: 'left' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Paiement Local & Validation Instantanée</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 28 }}>
              Réglez en Francs CFA via Mobile Money et activez votre clé API en quelques instants :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div style={{ padding: 18, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <MessageCircle size={20} color="#25D366" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Option A : Contact Direct Admin (WhatsApp)</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Virement Mobile Money officiel (MTN / Moov Bénin). Envoyez votre capture d'écran sur WhatsApp pour validation sous 24h.
                </p>
                <span className="badge badge-green">MTN & Moov Bénin</span>
              </div>

              <div style={{ padding: 18, borderRadius: 12, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Shield size={20} color="var(--axis-purple)" />
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>Option B : Agent Modérateur (Code MOD-XXXX)</h3>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 12 }}>
                  Saisissez l'identifiant du modérateur de proximité qui vous accompagne. Dès qu'il valide votre reçu, votre clé s'active instantanément.
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
          <span>PostgreSQL RPC</span>
          <span>1 500 à 30 000 XOF</span>
          <span>Mobile Money</span>
        </div>
      </footer>
    </div>
  );
};
