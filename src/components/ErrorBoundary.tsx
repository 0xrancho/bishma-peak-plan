import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background terminal-screen flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="ascii-art mb-8 sherpa-text text-center">
{`
    /\\        SYSTEM ERROR
   /  \\       Unexpected condition
  /____\\      encountered
 /      \\
/_______\\
`}
            </div>

            <div className="border border-summit-red bg-surface p-8">
              <div className="text-summit-red text-lg mb-4 font-mono">
                {'>'} CRITICAL ERROR DETECTED
              </div>

              <p className="text-muted-foreground mb-6 font-mono text-sm">
                The application encountered an unexpected error. This has been logged for investigation.
              </p>

              {this.state.error && (
                <div className="bg-background border border-terminal-border p-4 mb-6 font-mono text-xs text-muted-foreground overflow-auto max-h-40">
                  <div className="text-summit-red mb-2">ERROR: {this.state.error.message}</div>
                  {this.state.error.stack && (
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-sherpa-green text-background font-mono hover:bg-sherpa-green/90 transition-colors"
                >
                  RELOAD APPLICATION
                </button>

                <button
                  onClick={() => {
                    sessionStorage.clear();
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full px-6 py-3 border border-terminal-border text-foreground font-mono hover:bg-terminal-border/20 transition-colors"
                >
                  CLEAR DATA & RELOAD
                </button>
              </div>

              <div className="mt-6 text-center text-xs text-muted-foreground font-mono">
                If the problem persists, please contact support
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
