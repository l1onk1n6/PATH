import { Component, type ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, padding: 32, textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertTriangle size={24} style={{ color: '#FF3B30' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Etwas ist schiefgelaufen</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: '0 0 4px', maxWidth: 320 }}>
            Ein unerwarteter Fehler ist aufgetreten. Lade die Seite neu, um fortzufahren.
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0, fontFamily: 'monospace' }}>
            {this.state.error.message}
          </p>
        </div>
        <button
          className="btn-glass btn-primary"
          onClick={() => window.location.reload()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px' }}
        >
          <RefreshCw size={14} /> Seite neu laden
        </button>
      </div>
    );
  }
}
