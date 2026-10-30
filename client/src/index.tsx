import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import RoutesComponent from './app';
import { Toaster } from './components/ui/sonner';
import './index.css';
createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <main role="alert">
          <h1>演示页面暂时无法打开</h1>
          <button onClick={resetErrorBoundary}>重试</button>
          <button
            onClick={() => {
              location.hash = '/';
              location.reload();
            }}
          >
            回到入口
          </button>
        </main>
      )}
    >
      <RoutesComponent />
      <Toaster />
    </ErrorBoundary>
  </HashRouter>,
);
