import { Link } from 'react-router-dom';
import { AxisLogo } from '../components/AxisLogo';
import { Code2, Terminal, Briefcase, Globe, Shield, MessageCircle, CheckCircle2, Zap } from 'lucide-react';

const TIERS = [
  { id: 1, name: 'Starter', price: 10, budget: 10, maxCost: 5.00, desc: 'Modèles gratuits & ultra-économiques (Gemini Flash, Llama 70B Free)' },
  { id: 2, name: 'Basic', price: 25, budget: 25, maxCost: 10.00, desc: 'Modèles légers et rapides (GPT-4o Mini, Mistral Small)' },
  { id: 3, name: 'Standard', price: 50, budget: 50, maxCost: 15.00, desc: 'Modèles polyvalents équilibrés (DeepSeek V3, Claude 3 Haiku)' },
  { id: 4, name: 'Pro', price: 100, budget: 100, maxCost: 20.00, desc: 'Modèles de pointe pour code et rédaction avancée (Claude 3.5 Sonnet, GPT-4o)', popular: true },
  { id: 5, name: 'Expert', price: 200, budget: 200, maxCost: 25.00, desc: 'Modèles haute performance pour applications professionnelles intensives' },
  { id: 6, name: 'Master', price: 350, budget: 350, maxCost: 30.00, desc: 'Modèles de raisonnement lourd et logique avancée (DeepSeek R1, o1-mini)' },
  { id: 7, name: 'Enterprise', price: 500, budget: 500, maxCost: 35.00, desc: 'Accès illimité sans restriction aux plus gros modèles mondiaux' },
];

export const LandingPage = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="ax-hex-bg">
      {/* Header */}
      <header style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--axis-border)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(19,19,20,0.85)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AxisLogo size={28} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--axis-text)' }}>Axis AI</span>
          <span className="badge badge-green" style={{ fontSize: 10 }}>PROXY GATEKEEPER</span>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <Link to="/auth" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}>Connexion</Link>
          <Link to="/auth" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>S'inscrire</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, padding: '70px 20px', textAlign: 'center', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 90 }} className="ax-fade-in">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'var(--axis-accent-dim)', border: '1px solid rgba(132,204,22,0.3)', marginBottom: 24 }}>
            <Zap size={14} color="var(--axis-accent)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--axis-accent)' }}>Routeur Intelligent Axis Auto & Gatekeeper Anti-Surconsommation</span>
          </div>

          <div style={{ margin: '0 auto 24px', display: 'flex', justifyContent: 'center' }}>
            <AxisLogo size={76} className="ax-pulse-glow" />
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, marginBottom: 20, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            La passerelle d'API IA unifiée
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--axis-textMuted)', maxWidth: 720, margin: '0 auto 36px', lineHeight: 1.6 }}>
            Accédez à Claude 3.5 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3 et Gemini via <b>une seule clé API standard OpenAI</b> compatible avec tous vos outils.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16 }}>
              Commencer maintenant
            </Link>
            <a href="#tarifs" className="btn-ghost" style={{ padding: '14px 28px', fontSize: 16 }}>
              Voir les 7 Paliers
            </a>
          </div>
        </div>

        {/* Section Intégration IDE */}
        <section style={{ marginBottom: 110 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Compatible directement avec vos IDE et projets</h2>
          <p style={{ color: 'var(--axis-textMuted)', marginBottom: 40, fontSize: 15 }}>Remplacez simplement l'endpoint OpenAI par le proxy Axis dans votre environnement de dev favori.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {[
              { icon: Terminal, title: 'Claude Code', desc: 'Agent CLI d’Anthropic avec support Axis Proxy' },
              { icon: Code2, title: 'Cursor & Windsurf', desc: 'Autocomplétion & chat en direct avec les modèles autorisés' },
              { icon: Briefcase, title: 'VS Code & Continue', desc: 'Routage automatique vers le meilleur modèle selon le prompt' },
              { icon: Globe, title: 'Apps Web & Mobile', desc: 'SDK OpenAI officiel en Python, TypeScript ou cURL' },
            ].map((tool, i) => (
              <div key={i} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--axis-accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <tool.icon size={22} color="var(--axis-accent)" />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700 }}>{tool.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--axis-textMuted)', lineHeight: 1.5 }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section Tarifs 7 Paliers */}
        <section id="tarifs" style={{ marginBottom: 110 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--axis-textMuted)' }}>FORMULE : MaxAllowedCost(Pᵢ) = 5.00$ × i</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Les 7 Paliers de Tarification</h2>
          <p style={{ color: 'var(--axis-textMuted)', marginBottom: 44, fontSize: 15, maxWidth: 680, margin: '0 auto 44px' }}>
            Budget utilisable en USD, payable en Francs CFA (XOF) via Mobile Money au Bénin ou partout en zone UEMOA.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, textAlign: 'left' }}>
            {TIERS.map(tier => (
              <div key={tier.id} className="card card-hover" style={{
                border: tier.popular ? '2px solid var(--axis-accent)' : '1px solid var(--axis-border)',
                position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: tier.popular ? 'linear-gradient(180deg, rgba(132,204,22,0.06) 0%, var(--axis-sidebar) 100%)' : 'var(--axis-sidebar)'
              }}>
                {tier.popular && (
                  <span style={{ position: 'absolute', top: -12, right: 20, background: 'var(--axis-accent)', color: '#131314', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                    RECOMMANDÉ
                  </span>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>Palier {tier.id}</h3>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--axis-accent)' }}>{tier.name}</span>
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 2 }}>${tier.price} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--axis-muted)' }}>/ 30 jours</span></div>
                  <div style={{ color: 'var(--axis-textMuted)', fontSize: 13, marginBottom: 18 }}>≈ {(tier.price * 600).toLocaleString('fr-FR')} FCFA (XOF)</div>

                  <p style={{ fontSize: 12, color: 'var(--axis-textMuted)', marginBottom: 20, minHeight: 36, lineHeight: 1.4 }}>{tier.desc}</p>

                  <div style={{ borderTop: '1px solid var(--axis-border)', paddingTop: 14, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--axis-textMuted)' }}>Enveloppe budget :</span>
                      <b style={{ color: 'var(--axis-text)' }}>${tier.budget}.00 USD</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--axis-textMuted)' }}>Plafond modèle :</span>
                      <b style={{ color: 'var(--axis-accent)' }}>≤ ${tier.maxCost.toFixed(2)} / 1M</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--axis-textMuted)' }}>Durée de validité :</span>
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
        <section style={{ marginBottom: 60, padding: 40, borderRadius: 24, border: '1px solid var(--axis-border)', background: 'linear-gradient(135deg, rgba(30,31,32,0.9) 0%, rgba(19,19,20,0.95) 100%)', textAlign: 'left' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Paiement Simple & Validation Rapide</h2>
            <p style={{ color: 'var(--axis-textMuted)', fontSize: 14, marginBottom: 32 }}>Deux options adaptées au marché local pour activer instantanément votre clé API :</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              <div style={{ padding: 20, borderRadius: 14, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <MessageCircle size={22} color="#25D366" />
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Option A : Contact Direct Admin</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 14 }}>
                  Règlement Mobile Money (MTN / Moov Bénin) directement sur le numéro officiel. Envoyez votre preuve par WhatsApp pour validation sous 24h.
                </p>
                <span className="badge badge-green">Paiement Mobile Money</span>
              </div>

              <div style={{ padding: 20, borderRadius: 14, background: 'var(--axis-bg)', border: '1px solid var(--axis-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Shield size={22} color="var(--axis-accent)" />
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>Option B : Agent Modérateur de Proximité</h3>
                </div>
                <p style={{ fontSize: 13, color: 'var(--axis-textMuted)', lineHeight: 1.5, marginBottom: 14 }}>
                  Saisissez l'identifiant unique de votre modérateur (ex: <b>MOD-7777</b>). Dès qu'il valide votre reçu en ligne, votre abonnement démarre immédiatement.
                </p>
                <span className="badge badge-purple">Activation Instantanée</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--axis-border)', padding: '30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--axis-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AxisLogo size={20} />
          <span>Axis AI © 2025 · Infrastructure Gatekeeper Haute Performance</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <span>PostgreSQL Native RPCs</span>
          <span>1 Clé = 1 Pack</span>
          <span>Zéro Edge Function</span>
        </div>
      </footer>
    </div>
  );
};
