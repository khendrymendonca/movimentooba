import { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeText } from '@/utils/donationRules';

export type TicketCategory = 'ajuste_nome' | 'relato_bug' | 'sugestao' | 'outro';
export type TicketStatus = 'pendente' | 'em_analise' | 'resolvido' | 'cancelado';

export interface SupportTicket {
  id: string;
  protocol: string; // Ex: APO-2026-1042
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  category: TicketCategory;
  categoryLabel: string;
  slaDays: number; // 2 ou 5
  slaBusinessDaysText: string; // "2 dias úteis" | "5 dias úteis"
  
  title: string;
  description: string;
  currentName?: string;
  requestedName?: string;
  affectedScreen?: string;
  
  status: TicketStatus;
  adminResponse?: string;
  adminId?: string;
  adminName?: string;
  
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export const TICKET_PREFIX = '[CHAMADO_APOIO] ';
const LOCAL_STORAGE_KEY = 'o_bom_amigo_support_tickets_v1';

export const CATEGORY_CONFIG: Record<
  TicketCategory,
  { label: string; slaDays: number; slaText: string; defaultTitle: string }
> = {
  ajuste_nome: {
    label: 'Ajuste no nome da carteirinha',
    slaDays: 2,
    slaText: '2 dias úteis',
    defaultTitle: 'Solicitação de ajuste de nome na Carteirinha Digital',
  },
  relato_bug: {
    label: 'Relatar bug / erro no aplicativo',
    slaDays: 5,
    slaText: '5 dias úteis',
    defaultTitle: 'Relato de bug no aplicativo',
  },
  sugestao: {
    label: 'Sugestão de melhoria',
    slaDays: 5,
    slaText: '5 dias úteis',
    defaultTitle: 'Sugestão para o projeto ou aplicativo',
  },
  outro: {
    label: 'Dúvidas ou outro assunto',
    slaDays: 3,
    slaText: '2 a 5 dias úteis',
    defaultTitle: 'Dúvida ou solicitação geral',
  },
};

/**
 * Lê chamados armazenados localmente no navegador (fallback para modo offline/contingência)
 */
function getLocalTickets(): Record<string, SupportTicket> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Salva chamados localmente
 */
function saveLocalTicket(ticket: SupportTicket) {
  if (typeof window === 'undefined') return;
  try {
    const all = getLocalTickets();
    all[ticket.id] = ticket;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Erro ao salvar localmente o chamado:', e);
  }
}

/**
 * Gera um protocolo padronizado no formato APO-2026-XXXX
 */
export function generateTicketProtocol(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `APO-2026-${randomNum}`;
}

/**
 * Busca todos os chamados de apoio (ou filtrados por doador específico)
 */
export async function fetchSupportTickets(
  supabase: SupabaseClient,
  userIdFilter?: string
): Promise<SupportTicket[]> {
  const ticketsMap = new Map<string, SupportTicket>();

  // 1. Carrega do localStorage primeiro (para resposta instantânea e fallback)
  const localItems = getLocalTickets();
  Object.values(localItems).forEach((t) => {
    if (!userIdFilter || t.userId === userIdFilter) {
      ticketsMap.set(t.id, t);
    }
  });

  // 2. Busca da tabela donation_guides no Supabase
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('*')
      .like('title', `${TICKET_PREFIX}%`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      for (const row of data) {
        try {
          const parsed: SupportTicket = JSON.parse(row.content);
          if (parsed && parsed.id) {
            // Guarda o id do registro no row caso precise atualizar depois
            parsed.id = parsed.id || String(row.id);
            if (!userIdFilter || parsed.userId === userIdFilter) {
              ticketsMap.set(parsed.id, parsed);
              saveLocalTicket(parsed);
            }
          }
        } catch {
          // Ignora JSON corrompido
        }
      }
    }
  } catch (err) {
    console.warn('Fallback para chamados locais de apoio:', err);
  }

  // Ordena por data de criação decrescente
  return Array.from(ticketsMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Cria um novo chamado de apoio
 */
export async function createSupportTicket(
  supabase: SupabaseClient,
  data: {
    userId: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    category: TicketCategory;
    title?: string;
    description: string;
    currentName?: string;
    requestedName?: string;
    affectedScreen?: string;
  }
): Promise<{ ticket: SupportTicket | null; error: string | null }> {
  try {
    const categoryInfo = CATEGORY_CONFIG[data.category] || CATEGORY_CONFIG.outro;
    const protocol = generateTicketProtocol();
    const id = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      id,
      protocol,
      userId: data.userId,
      userName: sanitizeText(data.userName, 100),
      userEmail: data.userEmail ? sanitizeText(data.userEmail, 120) : undefined,
      userPhone: data.userPhone ? sanitizeText(data.userPhone, 40) : undefined,
      category: data.category,
      categoryLabel: categoryInfo.label,
      slaDays: categoryInfo.slaDays,
      slaBusinessDaysText: categoryInfo.slaText,
      title: sanitizeText(data.title || categoryInfo.defaultTitle, 140),
      description: sanitizeText(data.description, 1000),
      currentName: data.currentName ? sanitizeText(data.currentName, 100) : undefined,
      requestedName: data.requestedName ? sanitizeText(data.requestedName, 100) : undefined,
      affectedScreen: data.affectedScreen ? sanitizeText(data.affectedScreen, 80) : undefined,
      status: 'pendente',
      createdAt: now,
      updatedAt: now,
    };

    // Salva localmente
    saveLocalTicket(newTicket);

    // Salva no Supabase
    const { error } = await supabase.from('donation_guides').insert([
      {
        title: `${TICKET_PREFIX}${id}`,
        content: JSON.stringify(newTicket),
        updated_by: data.userId,
      },
    ]);

    if (error) {
      console.warn('Aviso: salvo em cache local devido a restrição temporária do banco:', error.message);
    }

    return { ticket: newTicket, error: null };
  } catch (err: any) {
    return { ticket: null, error: err?.message || 'Erro ao registrar chamado de apoio.' };
  }
}

/**
 * Atualiza o status e a resposta de um chamado pelo Gestor
 */
export async function updateSupportTicket(
  supabase: SupabaseClient,
  ticketId: string,
  updates: {
    status: TicketStatus;
    adminResponse?: string;
    adminId?: string;
    adminName?: string;
  }
): Promise<{ error: string | null; updatedTicket?: SupportTicket }> {
  try {
    const all = await fetchSupportTickets(supabase);
    const existing = all.find((t) => t.id === ticketId);

    if (!existing) {
      return { error: 'Chamado não encontrado.' };
    }

    const now = new Date().toISOString();
    const isResolving = updates.status === 'resolvido' && existing.status !== 'resolvido';

    const updated: SupportTicket = {
      ...existing,
      status: updates.status,
      adminResponse: updates.adminResponse ? sanitizeText(updates.adminResponse, 1000) : existing.adminResponse,
      adminId: updates.adminId || existing.adminId,
      adminName: updates.adminName ? sanitizeText(updates.adminName, 80) : existing.adminName,
      updatedAt: now,
      ...(isResolving ? { resolvedAt: now } : {}),
    };

    saveLocalTicket(updated);

    // Atualiza no Supabase
    // Busca se existe registro com title = '[CHAMADO_APOIO] <id>'
    const { data } = await supabase
      .from('donation_guides')
      .select('id')
      .eq('title', `${TICKET_PREFIX}${ticketId}`)
      .limit(1);

    if (data && data.length > 0) {
      await supabase
        .from('donation_guides')
        .update({
          content: JSON.stringify(updated),
          updated_by: updates.adminId || null,
        })
        .eq('id', data[0].id);
    } else {
      // Se não encontrou, insere
      await supabase.from('donation_guides').insert([
        {
          title: `${TICKET_PREFIX}${ticketId}`,
          content: JSON.stringify(updated),
          updated_by: updates.adminId || null,
        },
      ]);
    }

    // Se houver resposta ou o chamado foi concluído, envia notificação no app do membro
    if (updates.adminResponse || isResolving) {
      await sendTicketNotificationToUser(
        supabase,
        updated.userId,
        updated.protocol,
        updated.status,
        updated.adminResponse || 'Seu chamado foi atualizado pela coordenação do projeto.',
        updates.adminId
      );
    }

    return { error: null, updatedTicket: updated };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao atualizar o chamado.' };
  }
}

/**
 * Aplica diretamente a alteração do nome no perfil do doador e conclui o chamado
 */
export async function approveNameChangeTicket(
  supabase: SupabaseClient,
  ticket: SupportTicket,
  adminId?: string,
  adminName?: string
): Promise<{ error: string | null }> {
  if (ticket.category !== 'ajuste_nome' || !ticket.requestedName) {
    return { error: 'Este chamado não possui solicitação de alteração de nome válida.' };
  }

  try {
    const cleanName = sanitizeText(ticket.requestedName, 100);

    // 1. Atualiza no Supabase o nome do perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: cleanName })
      .eq('id', ticket.userId);

    if (profileError) {
      return { error: `Erro ao atualizar nome no perfil: ${profileError.message}` };
    }

    // 2. Conclui o chamado com parecer positivo
    const defaultResponse = `Seu nome foi ajustado com sucesso para "${cleanName}". O novo nome já consta em sua Carteirinha Digital!`;
    await updateSupportTicket(supabase, ticket.id, {
      status: 'resolvido',
      adminResponse: defaultResponse,
      adminId,
      adminName: adminName || 'Coordenação O Bom Amigo',
    });

    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao processar ajuste de nome.' };
  }
}

/**
 * Envia notificação interna no app informando o doador da atualização do chamado
 */
async function sendTicketNotificationToUser(
  supabase: SupabaseClient,
  userId: string,
  protocol: string,
  status: TicketStatus,
  message: string,
  adminId?: string
) {
  try {
    const statusText =
      status === 'resolvido'
        ? 'Resolvido com Sucesso'
        : status === 'em_analise'
        ? 'Em Análise pela Coordenação'
        : 'Atualizado';

    const payload = {
      target_user_id: userId,
      type: 'chamado',
      title: `💬 Chamado ${protocol}: ${statusText}`,
      message: sanitizeText(message, 600),
      link: '/doador/apoio',
      created_at: new Date().toISOString(),
    };

    await supabase.from('donation_guides').insert([
      {
        title: `[NOTIF_USER] ${userId}`,
        content: JSON.stringify(payload),
        updated_by: adminId || null,
      },
    ]);
  } catch (e) {
    console.error('Erro ao enviar notificação de chamado para o usuário:', e);
  }
}
