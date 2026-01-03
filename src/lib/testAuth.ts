import { supabase } from '@/lib/supabase'

// Função para testar se auth.uid() funciona via RPC
export async function testAuthContext() {
  try {
    const { data, error } = await supabase.rpc('test_auth_context')
    
    if (error) {
      console.error('❌ Erro ao testar auth context:', error)
      return null
    }
    
    console.log('✅ Auth context via RPC:', data)
    return data
  } catch (err) {
    console.error('❌ Exceção ao testar auth context:', err)
    return null
  }
}

// Função para testar se o usuário está autenticado
export async function testCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('❌ Erro ao buscar usuário:', error)
    return null
  }
  
  console.log('✅ Usuário atual:', user)
  return user
}
