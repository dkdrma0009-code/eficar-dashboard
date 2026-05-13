'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 200, padding: 32, textAlign: 'center',
          background: '#FEF2F2', borderRadius: 12, border: '1px solid #FECACA', margin: 16,
        }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#DC2626', marginBottom: 8 }}>
            이 섹션을 불러오는 중 오류가 발생했습니다
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 400, lineHeight: 1.6 }}>
            {this.state.message || '알 수 없는 오류'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{
              marginTop: 16, padding: '8px 20px', borderRadius: 8,
              background: '#DC2626', color: 'white', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
