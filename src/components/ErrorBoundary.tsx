import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Critical Error Captured:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#020617] p-6 text-center text-slate-900 dark:text-white">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-100 dark:border-rose-500/20">
              <AlertTriangle className="h-10 w-10" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black uppercase tracking-tight mb-3 italic">
            Process <span className="text-rose-500">Halted</span>
          </h1>
          
          <p className="max-w-md text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-10">
            Institutional Audit Synchronization Encountered a Critical Exception
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-background-dark font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none text-[10px]"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Session
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 transition-all outline-none text-[10px]"
            >
              <Home className="h-4 w-4" />
              Return Home
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-12 text-left w-full max-w-2xl bg-slate-900 rounded-2xl p-6 overflow-auto border border-white/5 shadow-2xl">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Diagnostic Trace</p>
              <pre className="text-[11px] font-mono text-slate-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {this.state.error.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
