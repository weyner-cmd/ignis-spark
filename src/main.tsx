import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './components/ErrorBoundary.css'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento #root não encontrado.')
}

const root = createRoot(rootElement)

const clearLocalStateAndReload = () => {
  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      if (
        key.startsWith('sb-') ||
        key.startsWith('supabase') ||
        key === 'ignis_selected_tenant_id'
      ) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key))
    sessionStorage.clear()
  } catch (error) {
    console.error('[bootstrap] Falha ao limpar storage local', error)
  }

  window.location.reload()
}

const StartupError = ({ title, details, extra }: { title: string; details?: string; extra?: ReactNode }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: '24px',
      background: 'var(--background)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-ui)',
    }}
  >
    <div
      style={{
        width: '100%',
        maxWidth: '560px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h1>
      {details ? <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>{details}</p> : null}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
        <button className="btn-secondary" onClick={clearLocalStateAndReload}>
          Limpar sessão e recarregar
        </button>
      </div>
      {extra}
    </div>
  </div>
)

const renderStartupError = (title: string, details?: string) => {
  root.render(
    <StrictMode>
      <StartupError
        title={title}
        details={details}
        extra={<p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Se persistir, tente aba anônima para validar extensão/cache do navegador.</p>}
      />
    </StrictMode>,
  )
}

const bootstrap = async () => {
  const watchdog = window.setTimeout(() => {
    renderStartupError('A inicialização demorou mais do que o esperado.')
  }, 15000)

  try {
    const [
      { default: App },
      { ErrorBoundary },
      { TenantProvider },
      { AuthProvider },
    ] = await Promise.all([
      import('./App.tsx'),
      import('./components/ErrorBoundary'),
      import('./contexts/TenantContext'),
      import('./contexts/AuthContext'),
    ])

    window.clearTimeout(watchdog)

    root.render(
      <StrictMode>
        <ErrorBoundary
          fallback={
            <StartupError
              title="O app encontrou um erro inesperado."
              details="Use o modo de recuperação para limpar sessão local e abrir novamente."
            />
          }
        >
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TenantProvider>
                <App />
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '13px',
                    },
                    success: {
                      iconTheme: { primary: 'var(--success)', secondary: 'white' },
                    },
                    error: {
                      iconTheme: { primary: 'var(--primary)', secondary: 'white' },
                    },
                  }}
                />
              </TenantProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </StrictMode>,
    )
  } catch (error) {
    window.clearTimeout(watchdog)
    console.error('[bootstrap] Falha crítica ao iniciar a aplicação', error)
    renderStartupError(
      'Não foi possível iniciar o app.',
      error instanceof Error ? error.message : 'Erro desconhecido de inicialização.',
    )
  }
}

void bootstrap()
