// src/components/RalphTownLanding.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ██████╗  █████╗ ██╗     ██████╗ ██╗  ██╗    ████████╗ ██████╗ ██╗    ██╗███╗   ██╗
// ██╔══██╗██╔══██╗██║     ██╔══██╗██║  ██║    ╚══██╔══╝██╔═══██╗██║    ██║████╗  ██║
// ██████╔╝███████║██║     ██████╔╝███████║       ██║   ██║   ██║██║ █╗ ██║██╔██╗ ██║
// ██╔══██╗██╔══██║██║     ██╔═══╝ ██╔══██║       ██║   ██║   ██║██║███╗██║██║╚██╗██║
// ██║  ██║██║  ██║███████╗██║     ██║  ██║       ██║   ╚██████╔╝╚███╔███╔╝██║ ╚████║
// ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝       ╚═╝    ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝
// 
// THE ANTITHESIS OF GAS TOWN
// Where Gas Town is chaos, Ralph Town is precision.
// Where Gas Town slings fish, Ralph Town orchestrates alpha.
// Where Gas Town runs on guzzoline, Ralph Town runs on recursive intelligence.
//
// Built on the foundation. Transcending the vision.
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// THEME - SOLANA CYBERPUNK NOIR
// ═══════════════════════════════════════════════════════════════════════════════

const theme = {
  // The Void
  void: '#000000',
  abyss: '#030305',
  deep: '#050508',
  dark: '#0a0a12',
  surface: '#0d0d18',
  elevated: '#12121f',
  
  // Solana Sacred Colors
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
  
  // Accent Spectrum
  cyan: '#00D4FF',
  cyanGlow: 'rgba(0, 212, 255, 0.5)',
  gold: '#FFD700',
  goldGlow: 'rgba(255, 215, 0, 0.4)',
  
  // Status
  success: '#14F195',
  danger: '#FF3B5C',
  warning: '#FFB020',
  info: '#00D4FF',
  
  // Boundaries
  border: '#1a1a3f',
  borderLight: '#2a2a5f',
  borderPurple: 'rgba(153, 69, 255, 0.4)',
  borderGreen: 'rgba(20, 241, 149, 0.4)',
  
  // Typography
  text: '#E8E8F0',
  textBright: '#FFFFFF',
  textDim: '#8888AA',
  textMuted: '#555577',
  
  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  gradientPurple: 'linear-gradient(180deg, #9945FF 0%, #6B2FCC 100%)',
  gradientGreen: 'linear-gradient(180deg, #14F195 0%, #0FC07A 100%)',
  gradientVoid: 'linear-gradient(180deg, #0a0a12 0%, #000000 100%)',
  gradientRadial: 'radial-gradient(ellipse at center, #0d0d18 0%, #000000 70%)',
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
    
    .ralph-town * { box-sizing: border-box; }
    
    .ralph-town {
      scroll-behavior: smooth;
    }
    
    @keyframes pulse { 
      0%, 100% { opacity: 1; } 
      50% { opacity: 0.4; } 
    }
    
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.05); opacity: 1; }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes recursiveOrbit {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes recursiveOrbitReverse {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 20px ${theme.purpleGlow}, 0 0 40px ${theme.purpleGlow}; }
      50% { box-shadow: 0 0 40px ${theme.greenGlow}, 0 0 80px ${theme.greenGlow}; }
    }
    
    @keyframes scanlineMove {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    
    @keyframes typewriter {
      from { width: 0; }
      to { width: 100%; }
    }
    
    @keyframes dataStream {
      0% { background-position: 0% 0%; }
      100% { background-position: 0% 100%; }
    }
    
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .ralph-town ::-webkit-scrollbar { width: 8px; height: 8px; }
    .ralph-town ::-webkit-scrollbar-track { background: ${theme.void}; }
    .ralph-town ::-webkit-scrollbar-thumb { 
      background: linear-gradient(180deg, ${theme.purple} 0%, ${theme.green} 100%);
      border-radius: 4px;
    }
    .ralph-town ::-webkit-scrollbar-thumb:hover { background: ${theme.purple}; }
    
    .ralph-town ::selection {
      background: ${theme.purple};
      color: ${theme.textBright};
    }
  `}</style>
);

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

interface DividerProps {
  color?: string;
  glow?: boolean;
}

const Divider: React.FC<DividerProps> = ({ color = theme.border, glow = false }) => (
  <div style={{
    height: '1px',
    background: glow ? theme.gradientPrimary : color,
    opacity: glow ? 0.6 : 1,
    boxShadow: glow ? `0 0 20px ${theme.purpleGlow}` : 'none',
  }} />
);

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION - "WELCOME TO RALPH TOWN"
// ═══════════════════════════════════════════════════════════════════════════════

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: Math.random() > 0.5 ? theme.purple : theme.green,
      });
    }
    
    let frame = 0;
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(153, 69, 255, ${0.2 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      
      // Draw and update particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '80';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        p.x += p.speedX;
        p.y += p.speedY;
        
        if (p.x < 0 || p.x > width) p.speedX *= -1;
        if (p.y < 0 || p.y > height) p.speedY *= -1;
      });
      
      // Draw recursive rings in center
      const centerX = width / 2;
      const centerY = height / 2;
      
      for (let i = 0; i < 5; i++) {
        const radius = 60 + i * 40;
        const rotation = (frame * (0.5 - i * 0.1)) % 360;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(153, 69, 255, ${0.3 - i * 0.05})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 15]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Orbiting dot
        const angle = (rotation * Math.PI) / 180;
        const dotX = centerX + Math.cos(angle) * radius;
        const dotY = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? theme.purple : theme.green;
        ctx.shadowColor = i % 2 === 0 ? theme.purple : theme.green;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      frame++;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: theme.gradientRadial,
    }}>
      {/* Animated background */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.6,
        }}
      />
      
      {/* Grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(${theme.border}20 1px, transparent 1px),
          linear-gradient(90deg, ${theme.border}20 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.3,
      }} />
      
      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        background: `radial-gradient(circle, ${theme.purpleMist} 0%, transparent 70%)`,
        animation: 'breathe 4s infinite ease-in-out',
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        padding: '0 40px',
        maxWidth: '1000px',
      }}>
        {/* Pre-title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px',
          animation: 'fadeInUp 0.8s ease-out',
        }}>
          <LiveIndicator color={theme.green} size={8} />
          <span style={{ 
            color: theme.green, 
            fontSize: '12px', 
            fontWeight: '600', 
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}>
            PROTOCOL ONLINE • SOLANA MAINNET
          </span>
          <LiveIndicator color={theme.green} size={8} />
        </div>
        
        {/* Main title */}
        <h1 style={{
          fontSize: '72px',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '16px',
          animation: 'fadeInUp 0.8s ease-out 0.1s both',
        }}>
          <span style={{ color: theme.textBright }}>Welcome to </span>
          <GradientText size="72px" weight="800">Ralph Town</GradientText>
        </h1>
        
        {/* Subtitle */}
        <p style={{
          fontSize: '20px',
          color: theme.textDim,
          marginBottom: '40px',
          lineHeight: '1.6',
          animation: 'fadeInUp 0.8s ease-out 0.2s both',
        }}>
          The Antithesis of Gas Town. Where chaos becomes precision.<br/>
          Built on the foundation. <GlowText color={theme.green} size="20px">Transcending the vision.</GlowText>
        </p>
        
        {/* Stats bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '48px',
          marginBottom: '48px',
          animation: 'fadeInUp 0.8s ease-out 0.3s both',
        }}>
          {[
            { label: 'RECURSIVE DEPTH', value: '∞', color: theme.purple },
            { label: 'PRECISION', value: '99.7%', color: theme.green },
            { label: 'ALPHA CAPTURED', value: '$4.2M', color: theme.cyan },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: stat.color,
                textShadow: `0 0 30px ${stat.color}60`,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', color: theme.textDim, letterSpacing: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        
        {/* CTA */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          animation: 'fadeInUp 0.8s ease-out 0.4s both',
        }}>
          <button style={{
            padding: '16px 40px',
            background: theme.gradientPrimary,
            border: 'none',
            borderRadius: '8px',
            color: theme.void,
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '1px',
            boxShadow: `0 0 40px ${theme.purpleGlow}`,
            transition: 'all 0.3s ease',
          }}>
            ENTER RALPH TOWN
          </button>
          <button style={{
            padding: '16px 40px',
            background: 'transparent',
            border: `2px solid ${theme.purple}`,
            borderRadius: '8px',
            color: theme.purple,
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '1px',
            transition: 'all 0.3s ease',
          }}>
            VIEW DOCUMENTATION
          </button>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        animation: 'float 2s infinite ease-in-out',
      }}>
        <span style={{ color: theme.textDim, fontSize: '10px', letterSpacing: '2px' }}>SCROLL</span>
        <div style={{
          width: '24px',
          height: '40px',
          border: `2px solid ${theme.border}`,
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '8px',
        }}>
          <div style={{
            width: '4px',
            height: '8px',
            background: theme.purple,
            borderRadius: '2px',
            animation: 'pulse 1.5s infinite',
          }} />
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHILOSOPHY SECTION - GAS TOWN VS RALPH TOWN
// ═══════════════════════════════════════════════════════════════════════════════

const PhilosophySection = () => {
  const comparisons = [
    { gas: 'Chaos & Slop', ralph: 'Precision & Elegance', icon: '⚡' },
    { gas: 'Fish in Barrels', ralph: 'Orchestrated Alpha', icon: '🎯' },
    { gas: 'Guzzoline', ralph: 'Recursive Intelligence', icon: '🧠' },
    { gas: 'Chimps', ralph: 'Autonomous Agents', icon: '🤖' },
    { gas: 'Convoys', ralph: 'Caravans', icon: '🚀' },
    { gas: 'Throughput Focus', ralph: 'Precision + Throughput', icon: '📊' },
  ];

  return (
    <section style={{
      padding: '120px 40px',
      background: theme.deep,
      position: 'relative',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: theme.purpleMist,
            border: `1px solid ${theme.borderPurple}`,
            borderRadius: '20px',
            color: theme.purple,
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '2px',
            marginBottom: '24px',
          }}>
            THE PHILOSOPHY
          </span>
          <h2 style={{
            fontSize: '48px',
            fontWeight: '700',
            marginBottom: '20px',
          }}>
            <span style={{ color: theme.danger }}>Gas Town</span>
            <span style={{ color: theme.textDim }}> vs </span>
            <GradientText size="48px">Ralph Town</GradientText>
          </h2>
          <p style={{
            fontSize: '18px',
            color: theme.textDim,
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: '1.7',
          }}>
            Gas Town taught us how to swarm. Ralph Town teaches us how to <GlowText color={theme.green} size="18px">think</GlowText>.
            We don't just throw agents at work—we orchestrate recursive intelligence loops
            that compound understanding with every cycle.
          </p>
        </div>
        
        {/* Comparison grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {comparisons.map((comp, i) => (
            <div key={i} style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              padding: '30px',
              position: 'relative',
              overflow: 'hidden',
              animation: `fadeInUp 0.6s ease-out ${0.1 * i}s both`,
            }}>
              {/* Icon */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '24px',
                opacity: 0.5,
              }}>
                {comp.icon}
              </div>
              
              {/* Gas Town (crossed out) */}
              <div style={{
                color: theme.danger,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                textDecoration: 'line-through',
                opacity: 0.6,
              }}>
                {comp.gas}
              </div>
              
              {/* Arrow */}
              <div style={{
                color: theme.textMuted,
                fontSize: '20px',
                marginBottom: '8px',
              }}>
                ↓
              </div>
              
              {/* Ralph Town */}
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
              }}>
                <GlowText color={theme.green} size="18px">{comp.ralph}</GlowText>
              </div>
            </div>
          ))}
        </div>
        
        {/* Quote */}
        <div style={{
          marginTop: '80px',
          padding: '40px',
          background: `linear-gradient(135deg, ${theme.purpleMist} 0%, ${theme.greenMist} 100%)`,
          borderRadius: '16px',
          border: `1px solid ${theme.borderPurple}`,
          textAlign: 'center',
        }}>
          <blockquote style={{
            fontSize: '24px',
            fontStyle: 'italic',
            color: theme.text,
            lineHeight: '1.6',
            marginBottom: '20px',
          }}>
            "Gas Town is like a late 1800s factory with machines that can disembowel you.
            <br/>
            <GlowText color={theme.green} size="24px">Ralph Town is like a quantum computer that thinks for you.</GlowText>"
          </blockquote>
          <cite style={{ color: theme.textDim, fontSize: '14px' }}>
            — The Protocol Architect
          </cite>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE SECTION - THE ROAR STACK
// ═══════════════════════════════════════════════════════════════════════════════

const ArchitectureSection = () => {
  const roarStack = [
    {
      name: 'ALPHA FORMULAS',
      gas: 'Formulas',
      desc: 'TOML-defined trading strategies. Composable. Shareable. Profitable.',
      color: theme.purple,
    },
    {
      name: 'STRATEGY TEMPLATES',
      gas: 'Protomolecules',
      desc: 'Reusable workflow blueprints. Instantiate once, execute infinitely.',
      color: theme.purpleDeep,
    },
    {
      name: 'STRATEGIES',
      gas: 'Molecules',
      desc: 'Live trading workflows. Each step executed by recursive Ralph loops.',
      color: theme.cyan,
    },
    {
      name: 'SIGNALS',
      gas: 'Beads',
      desc: 'Atomic trading intents. Git-backed. Immutable. The source of truth.',
      color: theme.green,
    },
    {
      name: 'FLASHES',
      gas: 'Wisps',
      desc: 'Ephemeral order orchestration. Here and gone. Burned after execution.',
      color: theme.warning,
    },
  ];

  const workers = [
    { emoji: '🔮', name: 'THE ORACLE', gas: 'Mayor', desc: 'Chief concierge. Routes all trading intents through recursive analysis.', color: theme.purple },
    { emoji: '⚗️', name: 'THE MIXER', gas: 'Refinery', desc: 'Order aggregation. MEV protection. The merge queue for all trades.', color: theme.cyan },
    { emoji: '👁️', name: 'THE WATCHER', gas: 'Witness', desc: 'Monitors all scouts. Ensures strategy completion. Never sleeps.', color: theme.green },
    { emoji: '🌀', name: 'RECURSION ENGINE', gas: 'Deacon', desc: 'The daemon beacon. Propagates RALPH signals. The heartbeat.', color: theme.warning },
    { emoji: '🐱', name: 'SCOUTS', gas: 'Polecats', desc: 'Ephemeral trading agents. Swarm, execute, dissolve. Pure alpha hunters.', color: theme.cyan },
    { emoji: '💎', name: 'DIAMOND HANDS', gas: 'Crew', desc: 'Your personal agents. Long-lived. Trusted. Named by you.', color: theme.gold },
  ];

  return (
    <section style={{
      padding: '120px 40px',
      background: theme.void,
      position: 'relative',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(${theme.purple}10 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        opacity: 0.5,
      }} />
      
      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
        {/* ROAR Stack */}
        <div style={{ marginBottom: '120px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: theme.greenMist,
              border: `1px solid ${theme.borderGreen}`,
              borderRadius: '20px',
              color: theme.green,
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '2px',
              marginBottom: '24px',
            }}>
              THE ARCHITECTURE
            </span>
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '20px' }}>
              <GradientText size="48px">ROAR</GradientText>
              <span style={{ color: theme.textBright }}> Stack</span>
            </h2>
            <p style={{ fontSize: '16px', color: theme.textDim }}>
              <strong style={{ color: theme.green }}>R</strong>ecursive{' '}
              <strong style={{ color: theme.green }}>O</strong>rder{' '}
              <strong style={{ color: theme.green }}>A</strong>utomation{' '}
              <strong style={{ color: theme.green }}>R</strong>outing
              <span style={{ color: theme.textMuted }}> (MEOW → ROAR)</span>
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {roarStack.map((layer, i) => (
              <div key={layer.name} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '24px 30px',
                background: `linear-gradient(90deg, ${layer.color}15 0%, transparent 100%)`,
                border: `1px solid ${layer.color}40`,
                borderRadius: '12px',
                animation: `slideInLeft 0.5s ease-out ${0.1 * i}s both`,
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: layer.color,
                  boxShadow: `0 0 20px ${layer.color}`,
                  marginRight: '20px',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <GlowText color={layer.color} size="14px" weight="700">{layer.name}</GlowText>
                    <span style={{
                      padding: '2px 8px',
                      background: theme.surface,
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: theme.textMuted,
                    }}>
                      Gas: {layer.gas}
                    </span>
                  </div>
                  <div style={{ color: theme.textDim, fontSize: '12px' }}>{layer.desc}</div>
                </div>
                {i < roarStack.length - 1 && (
                  <div style={{ color: theme.textMuted, fontSize: '20px', marginLeft: '20px' }}>↓</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Worker Roles */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '20px' }}>
              <span style={{ color: theme.textBright }}>Worker </span>
              <GradientText size="40px">Hierarchy</GradientText>
            </h2>
            <p style={{ fontSize: '16px', color: theme.textDim }}>
              Autonomous agents, each with a sacred purpose
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {workers.map((worker, i) => (
              <div key={worker.name} style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: '12px',
                padding: '30px',
                transition: 'all 0.3s ease',
                animation: `fadeInUp 0.5s ease-out ${0.1 * i}s both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px' }}>{worker.emoji}</span>
                  <div>
                    <GlowText color={worker.color} size="14px" weight="700">{worker.name}</GlowText>
                    <div style={{
                      fontSize: '9px',
                      color: theme.textMuted,
                      marginTop: '2px',
                    }}>
                      Gas Town: {worker.gas}
                    </div>
                  </div>
                </div>
                <p style={{ color: theme.textDim, fontSize: '12px', lineHeight: '1.6' }}>
                  {worker.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECURSIVE RALPH SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const RecursiveRalphSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    let frame = 0;
    
    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 8, 0.15)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw recursive spirals
      for (let ring = 0; ring < 7; ring++) {
        const baseRadius = 50 + ring * 50;
        const points = 60;
        const speed = (7 - ring) * 0.003;
        const direction = ring % 2 === 0 ? 1 : -1;
        
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2 + frame * speed * direction;
          const wobble = Math.sin(angle * 3 + frame * 0.02) * 5;
          const radius = baseRadius + wobble;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = ring % 2 === 0 
          ? `rgba(153, 69, 255, ${0.6 - ring * 0.08})`
          : `rgba(20, 241, 149, ${0.6 - ring * 0.08})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Orbiting particles on each ring
        for (let p = 0; p < 3; p++) {
          const particleAngle = (frame * speed * direction * 2) + (p * Math.PI * 2 / 3);
          const px = centerX + Math.cos(particleAngle) * baseRadius;
          const py = centerY + Math.sin(particleAngle) * baseRadius;
          
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = ring % 2 === 0 ? theme.purple : theme.green;
          ctx.shadowColor = ring % 2 === 0 ? theme.purple : theme.green;
          ctx.shadowBlur = 15;
          ctx.fill();
        }
      }
      
      // Center core
      const coreGlow = Math.sin(frame * 0.05) * 10 + 30;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreGlow);
      gradient.addColorStop(0, theme.green);
      gradient.addColorStop(0.5, theme.purple);
      gradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreGlow, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowColor = theme.green;
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Center text
      ctx.fillStyle = theme.textBright;
      ctx.font = 'bold 16px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RALPH', centerX, centerY - 8);
      ctx.font = '10px JetBrains Mono';
      ctx.fillStyle = theme.green;
      ctx.fillText('DEPTH ∞', centerX, centerY + 10);
      
      frame++;
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  return (
    <section style={{
      padding: '120px 40px',
      background: `linear-gradient(180deg, ${theme.void} 0%, ${theme.deep} 100%)`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 500px',
          gap: '80px',
          alignItems: 'center',
        }}>
          {/* Content */}
          <div>
            <span style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: theme.purpleMist,
              border: `1px solid ${theme.borderPurple}`,
              borderRadius: '20px',
              color: theme.purple,
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '2px',
              marginBottom: '24px',
            }}>
              THE CORE PRINCIPLE
            </span>
            
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px', lineHeight: '1.2' }}>
              <GradientText size="48px">RALPH</GradientText>
              <br/>
              <span style={{ color: theme.textBright, fontSize: '24px' }}>
                Recursive Alpha Loop Processing Heuristic
              </span>
            </h2>
            
            <p style={{
              fontSize: '16px',
              color: theme.textDim,
              lineHeight: '1.8',
              marginBottom: '32px',
            }}>
              Where Gas Town uses <span style={{ color: theme.danger }}>GUPP</span> (Gastown Universal Propulsion Principle),
              Ralph Town evolves it into <span style={{ color: theme.green }}>RALPH</span>—a recursive intelligence engine
              that doesn't just process work, but <em>thinks</em> about it.
            </p>
            
            <div style={{
              padding: '24px',
              background: theme.surface,
              borderRadius: '12px',
              border: `1px solid ${theme.borderGreen}`,
              marginBottom: '32px',
            }}>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                color: theme.green,
                marginBottom: '16px',
              }}>
                // THE RALPH PRINCIPLE
              </div>
              <code style={{
                display: 'block',
                color: theme.text,
                fontSize: '13px',
                lineHeight: '1.8',
              }}>
                <span style={{ color: theme.purple }}>if</span> (hook.hasWork()) {'{'}<br/>
                &nbsp;&nbsp;<span style={{ color: theme.cyan }}>analyze</span>(work, <span style={{ color: theme.warning }}>depth++</span>);<br/>
                &nbsp;&nbsp;<span style={{ color: theme.purple }}>if</span> (confidence {'>'} threshold) {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: theme.green }}>execute</span>(work);<br/>
                &nbsp;&nbsp;{'}'} <span style={{ color: theme.purple }}>else</span> {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: theme.cyan }}>recurse</span>(); <span style={{ color: theme.textMuted }}>// go deeper</span><br/>
                &nbsp;&nbsp;{'}'}<br/>
                {'}'}
              </code>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}>
              {[
                { label: 'Nondeterministic', value: 'EXECUTION', color: theme.purple },
                { label: 'Deterministic', value: 'OUTCOMES', color: theme.green },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '20px',
                  background: `${item.color}10`,
                  borderRadius: '8px',
                  border: `1px solid ${item.color}40`,
                  textAlign: 'center',
                }}>
                  <div style={{ color: theme.textDim, fontSize: '10px', letterSpacing: '1px', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <GlowText color={item.color} size="16px" weight="700">{item.value}</GlowText>
                </div>
              ))}
            </div>
          </div>
          
          {/* Visualization */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              style={{ display: 'block' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE DASHBOARD SECTION
// ═══════════════════════════════════════════════════════════════════════════════

const LiveDashboardSection = () => {
  const [stats, setStats] = useState({
    activeScouts: 12,
    activeCaravans: 4,
    signalsPerMin: 42,
    totalPnl: 127340.50,
    winRate: 73.4,
    recursionDepth: 5,
  });
  
  const [activities] = useState([
    { time: '14:32:01', type: 'signal', message: 'BUY signal generated: X402/USDC @ $0.3847', color: theme.green },
    { time: '14:32:00', type: 'scout', message: 'SCOUT-047 completed momentum strategy', color: theme.cyan },
    { time: '14:31:58', type: 'caravan', message: 'CARAVAN-7X4F landed successfully (+$2,340)', color: theme.green },
    { time: '14:31:55', type: 'recursion', message: 'RALPH depth increased to 5 for macro analysis', color: theme.purple },
    { time: '14:31:52', type: 'mixer', message: 'Batch of 14 signals aggregated for execution', color: theme.warning },
  ]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeScouts: prev.activeScouts + Math.floor((Math.random() - 0.5) * 2),
        signalsPerMin: Math.floor(30 + Math.random() * 30),
        totalPnl: prev.totalPnl + (Math.random() - 0.3) * 500,
        recursionDepth: Math.floor(Math.random() * 3) + 4,
      }));
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{
      padding: '120px 40px',
      background: theme.deep,
      position: 'relative',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <LiveIndicator color={theme.green} size={10} />
            <span style={{
              padding: '8px 20px',
              background: theme.greenMist,
              border: `1px solid ${theme.borderGreen}`,
              borderRadius: '20px',
              color: theme.green,
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '2px',
            }}>
              LIVE DASHBOARD
            </span>
            <LiveIndicator color={theme.green} size={10} />
          </div>
          <h2 style={{ fontSize: '48px', fontWeight: '700' }}>
            <span style={{ color: theme.textBright }}>Real-Time </span>
            <GradientText size="48px">Protocol Status</GradientText>
          </h2>
        </div>
        
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {[
            { label: 'Active Scouts', value: stats.activeScouts, color: theme.cyan, icon: '🐱' },
            { label: 'Caravans', value: stats.activeCaravans, color: theme.warning, icon: '🚀' },
            { label: 'Signals/min', value: stats.signalsPerMin, color: theme.purple, icon: '📡' },
            { label: 'Total P&L', value: `$${(stats.totalPnl / 1000).toFixed(1)}K`, color: stats.totalPnl > 0 ? theme.green : theme.danger, icon: '💰' },
            { label: 'Win Rate', value: `${stats.winRate}%`, color: theme.green, icon: '🎯' },
            { label: 'RALPH Depth', value: stats.recursionDepth, color: theme.purple, icon: '🌀' },
          ].map(stat => (
            <div key={stat.label} style={{
              padding: '24px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: stat.color,
                textShadow: `0 0 20px ${stat.color}60`,
                marginBottom: '4px',
              }}>
                {stat.value}
              </div>
              <div style={{ color: theme.textDim, fontSize: '10px', letterSpacing: '1px' }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
        
        {/* Activity Feed */}
        <div style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: `1px solid ${theme.border}`,
            background: theme.elevated,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LiveIndicator color={theme.green} size={8} />
              <GlowText color={theme.green} size="12px" weight="700">ACTIVITY FEED</GlowText>
            </div>
            <span style={{ color: theme.textDim, fontSize: '10px' }}>Last 5 events</span>
          </div>
          
          <div style={{ padding: '8px 0' }}>
            {activities.map((activity, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 24px',
                borderBottom: i < activities.length - 1 ? `1px solid ${theme.border}30` : 'none',
                animation: i === 0 ? 'slideInLeft 0.3s ease-out' : 'none',
              }}>
                <span style={{ color: theme.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>
                  {activity.time}
                </span>
                <span style={{
                  padding: '4px 10px',
                  background: `${activity.color}20`,
                  borderRadius: '4px',
                  color: activity.color,
                  fontSize: '9px',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  minWidth: '70px',
                  textAlign: 'center',
                }}>
                  {activity.type.toUpperCase()}
                </span>
                <span style={{ color: theme.text, fontSize: '12px' }}>{activity.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARAVANS SECTION (Convoys equivalent)
// ═══════════════════════════════════════════════════════════════════════════════

interface Caravan {
  id: string;
  strategy: string;
  status: string;
  progress: number;
  signals: number;
  scouts: number;
  value: number;
  eta: number;
}

const CaravansSection = () => {
  const [caravans] = useState<Caravan[]>([
    { id: 'CAR-7X4F', strategy: 'MACRO_LONG', status: 'executing', progress: 72, signals: 8, scouts: 3, value: 45000, eta: 180 },
    { id: 'CAR-9K2M', strategy: 'ARB_SWEEP', status: 'pending', progress: 0, signals: 12, scouts: 5, value: 78000, eta: 0 },
    { id: 'CAR-3P8N', strategy: 'SCALP_BURST', status: 'landed', progress: 100, signals: 4, scouts: 2, value: 12000, eta: 0 },
    { id: 'CAR-6W1Q', strategy: 'TREND_FOLLOW', status: 'settling', progress: 95, signals: 6, scouts: 3, value: 34000, eta: 30 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executing': return theme.cyan;
      case 'pending': return theme.warning;
      case 'landed': return theme.green;
      case 'settling': return theme.purple;
      default: return theme.textDim;
    }
  };

  return (
    <section style={{
      padding: '120px 40px',
      background: theme.void,
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: theme.cyanGlow + '20',
            border: `1px solid ${theme.cyan}40`,
            borderRadius: '20px',
            color: theme.cyan,
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '2px',
            marginBottom: '24px',
          }}>
            WORK DELIVERY
          </span>
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '20px' }}>
            <GradientText size="48px">Caravans</GradientText>
            <span style={{ color: theme.textBright }}> in Transit</span>
          </h2>
          <p style={{ color: theme.textDim, fontSize: '16px' }}>
            Every trade bundle is a Caravan. Track them from signal to settlement.
            <br/>
            <span style={{ color: theme.textMuted }}>(Gas Town calls these "Convoys")</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {caravans.map(caravan => (
            <div key={caravan.id} style={{
              display: 'grid',
              gridTemplateColumns: '120px 140px 1fr 100px 100px 100px',
              alignItems: 'center',
              gap: '24px',
              padding: '24px 32px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
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
                {caravan.status.toUpperCase()}
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
                <div style={{ color: theme.purple, fontSize: '18px', fontWeight: '700' }}>{caravan.signals}</div>
                <div style={{ color: theme.textDim, fontSize: '9px' }}>SIGNALS</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: theme.cyan, fontSize: '18px', fontWeight: '700' }}>{caravan.scouts}</div>
                <div style={{ color: theme.textDim, fontSize: '9px' }}>SCOUTS</div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: theme.green, fontSize: '18px', fontWeight: '700' }}>${(caravan.value / 1000).toFixed(1)}K</div>
                <div style={{ color: theme.textDim, fontSize: '9px' }}>VALUE</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUIREMENTS SECTION
// ═══════════════════════════════════════════════════════════════════════════════

interface Requirement {
  level: string;
  title: string;
  desc: string;
  icon: string;
}

const RequirementsSection = () => {
  const requirements: Requirement[] = [
    {
      level: '1',
      title: 'Stage 6+ Coder',
      desc: 'You must be comfortable with 3-5 parallel agent instances minimum.',
      icon: '🎮',
    },
    {
      level: '2',
      title: 'Vibe Coding Commitment',
      desc: 'Work flows like water. Some gets done, some escapes. Throughput is king.',
      icon: '🌊',
    },
    {
      level: '3',
      title: 'Solana Native',
      desc: 'You understand SPL tokens, PDAs, and can read a block explorer.',
      icon: '⚡',
    },
    {
      level: '4',
      title: 'Capital Ready',
      desc: 'Ralph Town is expensive. API calls compound. Alpha generation requires fuel.',
      icon: '💎',
    },
  ];

  return (
    <section style={{
      padding: '120px 40px',
      background: `linear-gradient(180deg, ${theme.deep} 0%, ${theme.void} 100%)`,
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: `${theme.danger}20`,
            border: `1px solid ${theme.danger}40`,
            borderRadius: '20px',
            color: theme.danger,
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '2px',
            marginBottom: '24px',
          }}>
            ⚠️ REQUIREMENTS
          </span>
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '20px' }}>
            <span style={{ color: theme.textBright }}>Can You </span>
            <GradientText size="48px">Handle It?</GradientText>
          </h2>
          <p style={{ color: theme.textDim, fontSize: '16px', lineHeight: '1.7' }}>
            Ralph Town is not for everyone. Unlike Gas Town's chaos-tolerant approach,
            <br/>
            Ralph Town demands <GlowText color={theme.danger} size="16px">precision operators</GlowText>.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {requirements.map((req) => (
            <div key={req.level} style={{
              padding: '32px',
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '48px',
                opacity: 0.1,
              }}>
                {req.icon}
              </div>
              
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                background: theme.gradientPrimary,
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <span style={{ color: theme.void, fontWeight: '700' }}>{req.level}</span>
              </div>
              
              <h3 style={{ color: theme.textBright, fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                {req.title}
              </h3>
              <p style={{ color: theme.textDim, fontSize: '13px', lineHeight: '1.6' }}>
                {req.desc}
              </p>
            </div>
          ))}
        </div>
        
        <div style={{
          marginTop: '40px',
          padding: '32px',
          background: `linear-gradient(135deg, ${theme.danger}15 0%, ${theme.warning}15 100%)`,
          borderRadius: '12px',
          border: `1px solid ${theme.danger}30`,
          textAlign: 'center',
        }}>
          <p style={{ color: theme.text, fontSize: '16px', fontStyle: 'italic' }}>
            "If you have any doubt whatsoever, then you can't use it."
          </p>
          <p style={{ color: theme.textDim, fontSize: '12px', marginTop: '8px' }}>
            — Adapted from Gas Town's warning
          </p>
        </div>
      </div>
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════════════════════

const Footer = () => (
  <footer style={{
    padding: '60px 40px',
    background: theme.void,
    borderTop: `1px solid ${theme.border}`,
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px',
      }}>
        <div>
          <GradientText size="32px" weight="800">⟨X402⟩</GradientText>
          <p style={{ color: theme.textDim, fontSize: '12px', marginTop: '8px' }}>
            Ralph Town • The Antithesis of Gas Town
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Documentation', 'GitHub', 'Discord', 'Twitter'].map(link => (
            <a key={link} href="#" style={{
              color: theme.textDim,
              fontSize: '12px',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}>
              {link}
            </a>
          ))}
        </div>
      </div>
      
      <Divider glow />
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        fontSize: '10px',
        color: theme.textMuted,
      }}>
        <span>Built on the foundation of Gas Town by Steve Yegge • Transcended for Solana</span>
        <span>
          <GlowText color={theme.purple} size="10px" glow={false}>BIRDEYE</GlowText>
          {' • '}
          <GlowText color={theme.green} size="10px" glow={false}>HELIUS</GlowText>
          {' • '}
          <GlowText color={theme.cyan} size="10px" glow={false}>JUPITER</GlowText>
        </span>
      </div>
    </div>
  </footer>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

const RalphTownLanding = () => {
  return (
    <div className="ralph-town" style={{
      minHeight: '100vh',
      background: theme.void,
      color: theme.text,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <GlobalStyles />
      
      {/* Scanlines overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        pointerEvents: 'none',
        zIndex: 9999,
      }} />
      
      <HeroSection />
      <PhilosophySection />
      <ArchitectureSection />
      <RecursiveRalphSection />
      <LiveDashboardSection />
      <CaravansSection />
      <RequirementsSection />
      <Footer />
    </div>
  );
};

export default RalphTownLanding;
