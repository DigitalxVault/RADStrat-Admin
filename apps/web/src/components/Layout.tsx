import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/test', label: 'STT Test' },
  { path: '/parameters', label: 'Parameters' },
  { path: '/scoring', label: 'Scoring' },
  { path: '/prompts', label: 'Prompts' },
  { path: '/telemetry', label: 'Telemetry' },
  { path: '/logs', label: 'Logs' },
];

function Layout({ children }: LayoutProps) {
  return (
    <div className="app-container">
      <header style={{ padding: 'var(--space-md) var(--space-lg)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div className="flex items-center justify-between gap-md" style={{ marginBottom: 'var(--space-md)' }}>
            <h1 className="page-title" style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-on-dark)',
              letterSpacing: '-0.02em'
            }}>
              STT Tuning Console
            </h1>
            <div className="mono text-small" style={{ color: 'var(--text-muted)' }}>
              OpenAI Realtime
            </div>
          </div>

          <nav className="nav-tabs">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer style={{
        padding: 'var(--space-sm) var(--space-lg)',
        borderTop: '1px solid var(--stroke-dark)',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="flex justify-between items-center">
          <span className="mono text-small" style={{ color: 'var(--text-muted)' }}>
            RADStrat Admin Dashboard
          </span>
          <span className="mono text-small" style={{ color: 'var(--text-muted)' }}>
            v1.0.0
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
