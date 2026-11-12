import { createBrowserClient } from '@supabase/ssr'

// Em alguns navegadores (ex.: Opera, Safari), respostas GET da API REST podem ser servidas do
// cache HTTP do navegador, mostrando dados antigos (ex.: contagem de presenças confirmadas).
// Forçamos "no-store" em todas as requisições para o comportamento ser idêntico em qualquer browser.
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' })

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: noStoreFetch },
    }
  )
}
