// src/components/X402ProtocolFactory.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 PROTOCOL FACTORY
// The manufacturing floor where Alpha Formulas are forged
// Where Strategy Templates become live Strategies
// Where Signals are minted and Caravans are dispatched
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  void: '#000000',
  abyss: '#030305',
  deep: '#050508',
  dark: '#0a0a12',
  surface: '#0d0d18',
  elevated: '#12121f',
  purple: '#9945FF',
  purpleDeep: '#7B35D9',
  purpleLight: '#B06AFF',
  purpleMist: 'rgba(153, 69, 255, 0.15)',
  purpleGlow: 'rgba(153, 69, 255, 0.6)',
  green: '#14F195',
  greenDeep: '#0FC07A',
  greenLight: '#4DFFC0',
  greenMist: 'rgba(20, 241, 149, 0.15)',
  greenGlow: 'rgba(20, 241, 149, 0.6)',
  cyan: '#00D4FF',
  cyanGlow: 'rgba(0, 212, 255, 0.5)',
  gold: '#FFD700',
  goldGlow: 'rgba(255, 215, 0, 0.4)',
  success: '#14F195',
  danger: '#FF3B5C',
  warning: '#FFB020',
  info: '#00D4FF',
  border: '#1a1a3f',
  borderLight: '#2a2a5f',
  borderPurple: 'rgba(153, 69, 255, 0.4)',
  borderGreen: 'rgba(20, 241, 149, 0.4)',
  text: '#E8E8F0',
  textBright: '#FFFFFF',
  textDim: '#8888AA',
  textMuted: '#555577',
  gradientPrimary: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  gradientPurple: 'linear-gradient(180deg, #9945FF 0%, #6B2FCC 100%)',
  gradientGreen: 'linear-gradient(180deg, #14F195 0%, #0FC07A 100%)',
  gradientVoid: 'linear-gradient(180deg, #0a0a12 0%, #000000 100%)',
  gradientRadial: 'radial-gradient(ellipse at center, #0d0d18 0%, #000000 70%)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface GlowTextProps {
  children: React.ReactNode;
  color?: string;
  size?: string;
  weight?: string;
  glow?: boolean;
}

const GlowText: React.FC<GlowTextProps> = ({ children, color = theme.purple, size = '14px', weight = '600', glow = true }) => (
  <span style={{
    color,
    fontSize: size,
    fontWeight: weight,
    textShadow: glow ? `0 0 20px ${color}80, 0 0 40px ${color}40` : 'none',
    letterSpacing: '0.5px',
  }}>
    {children}
  </span>
);

interface GradientTextProps {
  children: React.ReactNode;
  size?: string;
  weight?: string;
}

const GradientText: React.FC<GradientTextProps> = ({ children, size = '14px', weight = '700' }) => (
  <span style={{
    fontSize: size,
    fontWeight: weight,
    background: theme.gradientPrimary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 0 30px rgba(153, 69, 255, 0.5))',
  }}>
    {children}
  </span>
);

interface LiveIndicatorProps {
  color?: string;
  size?: number;
  label?: string;
}

const LiveIndicator: React.FC<LiveIndicatorProps> = ({ color = theme.green, size = 8, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}60`,
      animation: 'pulse 2s infinite ease-in-out',
    }} />
    {label && <span style={{ color, fontSize: '10px', fontWeight: '600', letterSpacing: '1px' }}>{label}</span>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY HEADER
// ═══════════════════════════════════════════════════════════════════════════════

const FactoryHeader = () => {
  const [factoryStats, setFactoryStats] = useState({
    formulasInProduction: 12,
    activeStrategies: 47,
    signalsGenerated: 1240,
    caravansDispatched: 23,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setFactoryStats(prev => ({
        ...prev,
        signalsGenerated: prev.signalsGenerated + Math.floor(Math.random() * 3),
        formulasInProduction: Math.max(8, prev.formulasInProduction + Math.floor((Math.random() - 0.5) * 2)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      padding: '40px',
      background: theme.deep,
      borderBottom: `1px solid ${theme.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <GradientText size="32px" weight="800">⟨X402⟩</GradientText>
            <p style={{ color: theme.textDim, fontSize: '12px', marginTop: '4px' }}>
              Protocol Factory • Manufacturing Floor
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LiveIndicator color={theme.green} size={10} />
            <span style={{
              color: theme.green,
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '2px',
            }}>
              FACTORY ONLINE
            </span>
          </div>
        </div>
        
        {/* Factory Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          {[
            { label: 'Formulas in Production', value: factoryStats.formulasInProduction, color: theme.purple, icon: '⚗️' },
            { label: 'Active Strategies', value: factoryStats.activeStrategies, color: theme.cyan, icon: '🌀' },
            { label: 'Signals Generated', value: factoryStats.signalsGenerated, color: theme.green, icon: '📡' },
            { label: 'Caravans Dispatched', value: factoryStats.caravansDispatched, color: theme.warning, icon: '🚀' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '16px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{ fontSize: '24px' }}>{stat.icon}</span>
              <div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: stat.color,
                  textShadow: `0 0 20px ${stat.color}60`,
                }}>
                  {stat.value}
                </div>
                <div style={{ color: theme.textDim, fontSize: '9px', letterSpacing: '1px' }}>
                  {stat.label.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORMULA WORKBENCH
// ═══════════════════════════════════════════════════════════════════════════════

interface Formula {
  id: string;
  name: string;
  status: 'draft' | 'testing' | 'production' | 'archived';
  lastModified: string;
  profitability: number;
}

const FormulaWorkbench = () => {
  const [formulas, setFormulas] = useState<Formula[]>([
    { id: 'FORM-001', name: 'Momentum Breakout', status: 'production', lastModified: '2h ago', profitability: 87.3 },
    { id: 'FORM-002', name: 'Mean Reversion Scalp', status: 'testing', lastModified: '5h ago', profitability: 0 },
    { id: 'FORM-003', name: 'Arbitrage Sweep', status: 'production', lastModified: '1d ago', profitability: 92.1 },
    { id: 'FORM-004', name: 'Trend Following', status: 'draft', lastModified: '3d ago', profitability: 0 },
    { id: 'FORM-005', name: 'Volatility Expansion', status: 'production', lastModified: '6h ago', profitability: 74.5 },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormulaName, setNewFormulaName] = useState('');

  const getStatusColor = (status: Formula['status']) => {
    switch (status) {
      case 'production': return theme.green;
      case 'testing': return theme.warning;
      case 'draft': return theme.textDim;
      case 'archived': return theme.textMuted;
      default: return theme.textDim;
    }
  };

  const handleCreateFormula = () => {
    if (!newFormulaName.trim()) return;
    const newFormula: Formula = {
      id: `FORM-${String(formulas.length + 1).padStart(3, '0')}`,
      name: newFormulaName,
      status: 'draft',
      lastModified: 'just now',
      profitability: 0,
    };
    setFormulas([...formulas, newFormula]);
    setNewFormulaName('');
    setShowCreateModal(false);
  };

  return (
    <section style={{
      padding: '40px',
      background: theme.void,
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
              <GradientText size="32px">Alpha Formulas</GradientText>
            </h2>
            <p style={{ color: theme.textDim, fontSize: '14px' }}>
              TOML-defined trading strategies. Composable. Shareable. Profitable.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              background: theme.gradientPrimary,
              border: 'none',
              borderRadius: '8px',
              color: theme.void,
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '1px',
              boxShadow: `0 0 20px ${theme.purpleGlow}`,
            }}
          >
            + CREATE FORMULA
          </button>
        </div>

        {/* Formulas Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {formulas.map(formula => (
            <div key={formula.id} style={{
              padding: '24px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.purple;
              e.currentTarget.style.boxShadow = `0 0 20px ${theme.purpleMist}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '16px',
              }}>
                <div>
                  <GlowText color={theme.cyan} size="12px" weight="700">{formula.id}</GlowText>
                  <h3 style={{
                    color: theme.textBright,
                    fontSize: '18px',
                    fontWeight: '700',
                    marginTop: '4px',
                  }}>
                    {formula.name}
                  </h3>
                </div>
                <span style={{
                  padding: '4px 10px',
                  background: `${getStatusColor(formula.status)}20`,
                  border: `1px solid ${getStatusColor(formula.status)}`,
                  borderRadius: '4px',
                  color: getStatusColor(formula.status),
                  fontSize: '9px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                }}>
                  {formula.status.toUpperCase()}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: theme.textDim,
                marginBottom: '16px',
              }}>
                <span>Modified: {formula.lastModified}</span>
                {formula.profitability > 0 && (
                  <span style={{ color: theme.green }}>
                    Profitability: {formula.profitability}%
                  </span>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                gap: '8px',
              }}>
                <button style={{
                  flex: 1,
                  padding: '8px',
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  color: theme.text,
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  EDIT
                </button>
                <button style={{
                  flex: 1,
                  padding: '8px',
                  background: theme.purpleMist,
                  border: `1px solid ${theme.borderPurple}`,
                  borderRadius: '6px',
                  color: theme.purple,
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  DEPLOY
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Formula Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div style={{
            padding: '32px',
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              color: theme.textBright,
              fontSize: '20px',
              fontWeight: '700',
              marginBottom: '20px',
            }}>
              Create New Formula
            </h3>
            <input
              type="text"
              value={newFormulaName}
              onChange={(e) => setNewFormulaName(e.target.value)}
              placeholder="Formula name..."
              style={{
                width: '100%',
                padding: '12px',
                background: theme.deep,
                border: `1px solid ${theme.border}`,
                borderRadius: '8px',
                color: theme.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '20px',
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateFormula();
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  color: theme.text,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleCreateFormula}
                style={{
                  padding: '10px 20px',
                  background: theme.gradientPrimary,
                  border: 'none',
                  borderRadius: '6px',
                  color: theme.void,
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  complexity: 'simple' | 'moderate' | 'complex';
  instances: number;
}

const StrategyTemplates = () => {
  const [templates] = useState<StrategyTemplate[]>([
    {
      id: 'TEMP-001',
      name: 'Quick Scalp',
      description: 'Fast in, fast out. 5-minute timeframes. High frequency.',
      complexity: 'simple',
      instances: 12,
    },
    {
      id: 'TEMP-002',
      name: 'Trend Rider',
      description: 'Ride the wave. Multi-timeframe confirmation. Medium hold.',
      complexity: 'moderate',
      instances: 8,
    },
    {
      id: 'TEMP-003',
      name: 'Arbitrage Hunter',
      description: 'Cross-DEX price differences. MEV protected. Instant execution.',
      complexity: 'complex',
      instances: 5,
    },
    {
      id: 'TEMP-004',
      name: 'Momentum Burst',
      description: 'Catch the breakout. Volume confirmation. Stop-loss protection.',
      complexity: 'moderate',
      instances: 15,
    },
  ]);

  const getComplexityColor = (complexity: StrategyTemplate['complexity']) => {
    switch (complexity) {
      case 'simple': return theme.green;
      case 'moderate': return theme.warning;
      case 'complex': return theme.purple;
      default: return theme.textDim;
    }
  };

  return (
    <section style={{
      padding: '40px',
      background: theme.deep,
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            <GradientText size="32px">Strategy Templates</GradientText>
          </h2>
          <p style={{ color: theme.textDim, fontSize: '14px' }}>
            Reusable workflow blueprints. Instantiate once, execute infinitely.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {templates.map(template => (
            <div key={template.id} style={{
              padding: '24px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: '12px',
              }}>
                <GlowText color={theme.cyan} size="11px" weight="700">{template.id}</GlowText>
                <span style={{
                  padding: '4px 10px',
                  background: `${getComplexityColor(template.complexity)}20`,
                  border: `1px solid ${getComplexityColor(template.complexity)}`,
                  borderRadius: '4px',
                  color: getComplexityColor(template.complexity),
                  fontSize: '9px',
                  fontWeight: '700',
                }}>
                  {template.complexity.toUpperCase()}
                </span>
              </div>
              
              <h3 style={{
                color: theme.textBright,
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '8px',
              }}>
                {template.name}
              </h3>
              
              <p style={{
                color: theme.textDim,
                fontSize: '12px',
                lineHeight: '1.6',
                marginBottom: '16px',
              }}>
                {template.description}
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: theme.textMuted, fontSize: '10px' }}>
                  {template.instances} active instances
                </span>
                <button style={{
                  padding: '6px 14px',
                  background: theme.purpleMist,
                  border: `1px solid ${theme.borderPurple}`,
                  borderRadius: '6px',
                  color: theme.purple,
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  INSTANTIATE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL MINTING
// ═══════════════════════════════════════════════════════════════════════════════

interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  pair: string;
  price: number;
  timestamp: string;
  status: 'pending' | 'executed' | 'expired';
}

const SignalMinting = () => {
  const [signals, setSignals] = useState<Signal[]>([
    { id: 'SIG-001', type: 'BUY', pair: 'X402/USDC', price: 0.3847, timestamp: '14:32:01', status: 'executed' },
    { id: 'SIG-002', type: 'SELL', pair: 'SOL/USDC', price: 142.50, timestamp: '14:31:58', status: 'executed' },
    { id: 'SIG-003', type: 'BUY', pair: 'BTC/USDC', price: 43250.00, timestamp: '14:31:45', status: 'pending' },
    { id: 'SIG-004', type: 'HOLD', pair: 'ETH/USDC', price: 2450.00, timestamp: '14:31:30', status: 'pending' },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSignal: Signal = {
        id: `SIG-${String(signals.length + 1).padStart(3, '0')}`,
        type: ['BUY', 'SELL', 'HOLD'][Math.floor(Math.random() * 3)] as Signal['type'],
        pair: ['X402/USDC', 'SOL/USDC', 'BTC/USDC', 'ETH/USDC'][Math.floor(Math.random() * 4)],
        price: Math.random() * 50000,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'pending',
      };
      setSignals(prev => [newSignal, ...prev].slice(0, 10));
    }, 5000);
    return () => clearInterval(interval);
  }, [signals.length]);

  const getTypeColor = (type: Signal['type']) => {
    switch (type) {
      case 'BUY': return theme.green;
      case 'SELL': return theme.danger;
      case 'HOLD': return theme.warning;
      default: return theme.textDim;
    }
  };

  return (
    <section style={{
      padding: '40px',
      background: theme.void,
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            <GradientText size="32px">Signal Minting</GradientText>
          </h2>
          <p style={{ color: theme.textDim, fontSize: '14px' }}>
            Atomic trading intents. Git-backed. Immutable. The source of truth.
          </p>
        </div>

        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 80px 1fr 120px 100px 100px',
            gap: '16px',
            padding: '16px 24px',
            background: theme.elevated,
            borderBottom: `1px solid ${theme.border}`,
            fontSize: '10px',
            color: theme.textDim,
            fontWeight: '700',
            letterSpacing: '1px',
          }}>
            <div>ID</div>
            <div>TYPE</div>
            <div>PAIR</div>
            <div>PRICE</div>
            <div>TIME</div>
            <div>STATUS</div>
          </div>
          
          <div>
            {signals.map((signal, i) => (
              <div key={signal.id} style={{
                display: 'grid',
                gridTemplateColumns: '100px 80px 1fr 120px 100px 100px',
                gap: '16px',
                padding: '16px 24px',
                borderBottom: i < signals.length - 1 ? `1px solid ${theme.border}30` : 'none',
                fontSize: '12px',
                animation: i === 0 ? 'slideInLeft 0.3s ease-out' : 'none',
              }}>
                <GlowText color={theme.cyan} size="11px" weight="700">{signal.id}</GlowText>
                <span style={{
                  color: getTypeColor(signal.type),
                  fontWeight: '700',
                }}>
                  {signal.type}
                </span>
                <span style={{ color: theme.text }}>{signal.pair}</span>
                <span style={{ color: theme.textBright }}>${signal.price.toFixed(2)}</span>
                <span style={{ color: theme.textMuted, fontFamily: 'monospace' }}>{signal.timestamp}</span>
                <span style={{
                  padding: '4px 8px',
                  background: signal.status === 'executed' ? `${theme.green}20` : `${theme.warning}20`,
                  border: `1px solid ${signal.status === 'executed' ? theme.green : theme.warning}`,
                  borderRadius: '4px',
                  color: signal.status === 'executed' ? theme.green : theme.warning,
                  fontSize: '9px',
                  fontWeight: '700',
                  textAlign: 'center',
                }}>
                  {signal.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARAVAN DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

interface Caravan {
  id: string;
  strategy: string;
  status: 'queued' | 'assembling' | 'in-transit' | 'landed';
  signals: number;
  scouts: number;
  value: number;
  progress: number;
}

const CaravanDispatch = () => {
  const [caravans] = useState<Caravan[]>([
    { id: 'CAR-7X4F', strategy: 'MACRO_LONG', status: 'in-transit', signals: 8, scouts: 3, value: 45000, progress: 72 },
    { id: 'CAR-9K2M', strategy: 'ARB_SWEEP', status: 'queued', signals: 12, scouts: 5, value: 78000, progress: 0 },
    { id: 'CAR-3P8N', strategy: 'SCALP_BURST', status: 'landed', signals: 4, scouts: 2, value: 12000, progress: 100 },
    { id: 'CAR-6W1Q', strategy: 'TREND_FOLLOW', status: 'assembling', signals: 6, scouts: 3, value: 34000, progress: 45 },
  ]);

  const getStatusColor = (status: Caravan['status']) => {
    switch (status) {
      case 'landed': return theme.green;
      case 'in-transit': return theme.cyan;
      case 'assembling': return theme.warning;
      case 'queued': return theme.textDim;
      default: return theme.textDim;
    }
  };

  return (
    <section style={{
      padding: '40px',
      background: theme.deep,
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
            <GradientText size="32px">Caravan Dispatch</GradientText>
          </h2>
          <p style={{ color: theme.textDim, fontSize: '14px' }}>
            Track trade bundles from signal to settlement.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {caravans.map(caravan => (
            <div key={caravan.id} style={{
              padding: '24px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 140px 1fr 100px 100px 100px',
                alignItems: 'center',
                gap: '24px',
              }}>
                <GlowText color={theme.cyan} size="14px" weight="700">{caravan.id}</GlowText>
                
                <span style={{
                  padding: '6px 14px',
                  background: `${getStatusColor(caravan.status)}20`,
                  border: `1px solid ${getStatusColor(caravan.status)}`,
                  borderRadius: '6px',
                  color: getStatusColor(caravan.status),
                  fontSize: '10px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textAlign: 'center',
                }}>
                  {caravan.status.toUpperCase().replace('-', ' ')}
                </span>
                
                <div>
                  <div style={{
                    height: '8px',
                    background: theme.deep,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '6px',
                  }}>
                    <div style={{
                      width: `${caravan.progress}%`,
                      height: '100%',
                      background: caravan.status === 'landed' 
                        ? theme.green 
                        : theme.gradientPrimary,
                      boxShadow: `0 0 10px ${getStatusColor(caravan.status)}`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: theme.textDim }}>
                    <span>{caravan.strategy}</span>
                    <span>{caravan.progress}%</span>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: theme.purple, fontSize: '16px', fontWeight: '700' }}>{caravan.signals}</div>
                  <div style={{ color: theme.textDim, fontSize: '9px' }}>SIGNALS</div>
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: theme.cyan, fontSize: '16px', fontWeight: '700' }}>{caravan.scouts}</div>
                  <div style={{ color: theme.textDim, fontSize: '9px' }}>SCOUTS</div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: theme.green, fontSize: '16px', fontWeight: '700' }}>${(caravan.value / 1000).toFixed(1)}K</div>
                  <div style={{ color: theme.textDim, fontSize: '9px' }}>VALUE</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN FACTORY COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const X402ProtocolFactory = () => {
  return (
    <div className="x402-factory" style={{
      minHeight: '100vh',
      background: theme.void,
      color: theme.text,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');
        
        .x402-factory * { box-sizing: border-box; }
        
        @keyframes pulse { 
          0%, 100% { opacity: 1; } 
          50% { opacity: 0.4; } 
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .x402-factory ::-webkit-scrollbar { width: 8px; height: 8px; }
        .x402-factory ::-webkit-scrollbar-track { background: ${theme.void}; }
        .x402-factory ::-webkit-scrollbar-thumb { 
          background: linear-gradient(180deg, ${theme.purple} 0%, ${theme.green} 100%);
          border-radius: 4px;
        }
      `}</style>
      
      <FactoryHeader />
      <FormulaWorkbench />
      <StrategyTemplates />
      <SignalMinting />
      <CaravanDispatch />
    </div>
  );
};

export default X402ProtocolFactory;
