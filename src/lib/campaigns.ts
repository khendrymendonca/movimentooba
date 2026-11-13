import { SupabaseClient } from '@supabase/supabase-js';
import {
  GroupCampaign,
  SupportCampaign,
  AppNotification,
  sanitizeText,
  canDonateBlood,
  checkEligibilityForDate,
  parseSafeDate,
} from '@/utils/donationRules';

const CAMPAIGN_PREFIX = '[MUTIRAO] ';
const SUPPORT_PREFIX = '[SOS] ';
const NOTICE_PREFIX = '[AVISO_SISTEMA] ';
const CONFIG_KEY = '[CONFIG_PROJETO]';
export const MAX_CAMPAIGN_PARTICIPANTS = 20;

export interface ProjectConfig {
  id?: string;
  whatsappGroupUrl: string;
  hemocenterName: string;
  hemocenterPhone: string;
  hemocenterScheduleUrl: string;
}

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  whatsappGroupUrl: 'https://whatsapp.com/channel/0029VbE55L14yltHPKvKYE1z',
  hemocenterName: 'Hemocentro de Juiz de Fora - MG (Hemominas)',
  hemocenterPhone: '(31) 4042-7157',
  hemocenterScheduleUrl: 'https://www.mg.gov.br/agendamento_servico/doacao-de-sangue',
};

/**
 * Busca todas as próximas campanhas/doações em massa do grupo salvas no Supabase,
 * incluindo a lista e contagem de confirmações de presença (limite padrão de 20 vagas).
 */
export async function fetchGroupCampaigns(
  supabase: SupabaseClient,
  currentUserId?: string
): Promise<GroupCampaign[]> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('*')
      .like('title', `${CAMPAIGN_PREFIX}%`)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    const campaigns: GroupCampaign[] = [];
    for (const row of data) {
      try {
        const parsed = JSON.parse(row.content);
        if (parsed && parsed.campaign_date) {
          const jsonRsvps: { id: string; name: string; confirmedAt: string }[] = Array.isArray(
            parsed.confirmed_users
          )
            ? parsed.confirmed_users
            : [];

          const allConfirmed = jsonRsvps.filter(
            (u) =>
              u &&
              Boolean(u.id) &&
              !u.name?.toLowerCase().includes('diagnostico') &&
              !u.name?.toLowerCase().includes('diagnóstico')
          );
          const maxParticipants = parsed.max_participants || MAX_CAMPAIGN_PARTICIPANTS;

          campaigns.push({
            id: row.id,
            title: sanitizeText(parsed.title || row.title.replace(CAMPAIGN_PREFIX, ''), 120),
            campaign_date: parsed.campaign_date,
            campaign_time: sanitizeText(parsed.campaign_time || '08:00', 20),
            location: sanitizeText(parsed.location || 'Hemominas - Juiz de Fora', 150),
            description: sanitizeText(parsed.description || '', 400),
            max_participants: maxParticipants,
            confirmed_count: allConfirmed.length,
            confirmed_users: allConfirmed,
            user_confirmed: currentUserId
              ? allConfirmed.some((u) => u.id === currentUserId)
              : false,
          });
        }
      } catch {
        // Ignora linhas malformadas
      }
    }

    return campaigns.sort((a, b) => a.campaign_date.localeCompare(b.campaign_date));
  } catch {
    return [];
  }
}

/**
 * Confirma ou cancela a presença do doador em um mutirão (respeitando o teto de 20 vagas).
 */
export async function toggleCampaignConfirmation(
  supabase: SupabaseClient,
  campaignId: string,
  user: { id: string; name: string },
  currentlyConfirmed: boolean
): Promise<{ ok: boolean; error?: string; full?: boolean }> {
  try {
    const shouldConfirm = !currentlyConfirmed;

    // 1. Tenta a função atômica e idempotente set_campaign_rsvp instalada no Supabase
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('set_campaign_rsvp', {
      p_campaign_id: campaignId,
      p_user_name: sanitizeText(user.name || 'Doador', 80),
      p_confirm: shouldConfirm,
    });

    if (!rpcErr && rpcRes) {
      if (rpcRes.full) {
        return {
          ok: false,
          full: true,
          error:
            rpcRes.error ||
            'O mutirão já atingiu as 20 confirmações! Para doar nesta data, será necessário agendar individualmente pelo site oficial.',
        };
      }
      if (rpcRes.ok) {
        // Limpa arquivo residual do fallback caso existisse
        const userFolderFile = `${user.id}/rsvp_${campaignId}.png`;
        try {
          await supabase.storage.from('avatars').remove([userFolderFile]);
        } catch {}
        return { ok: true };
      }
      if (rpcRes.error) {
        return { ok: false, error: rpcRes.error };
      }
    }

    // 2. Fallback via toggle_campaign_rsvp (caso a versão anterior ainda responda)
    const { data: fallbackRpc, error: fallbackErr } = await supabase.rpc('toggle_campaign_rsvp', {
      p_campaign_id: campaignId,
      p_user_name: sanitizeText(user.name || 'Doador', 80),
    });

    if (!fallbackErr && fallbackRpc) {
      if (fallbackRpc.full) {
        return {
          ok: false,
          full: true,
          error:
            fallbackRpc.error ||
            'O mutirão já atingiu as 20 confirmações! Para doar nesta data, será necessário agendar individualmente pelo site oficial.',
        };
      }
      if (fallbackRpc.ok) {
        return { ok: true };
      }
    }

    return {
      ok: false,
      error: rpcErr?.message || fallbackErr?.message || 'Não foi possível atualizar a confirmação. Tente novamente.',
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erro de comunicação ao confirmar presença.' };
  }
}

/**
 * Cria uma nova data de doação em massa (mutirão do grupo) — Exclusivo para ADMs.
 */
export async function createGroupCampaign(
  supabase: SupabaseClient,
  campaign: Omit<GroupCampaign, 'id'>,
  userId?: string
): Promise<{ error: string | null }> {
  const cleanTitle = sanitizeText(campaign.title, 120);
  const payload = {
    title: cleanTitle,
    campaign_date: campaign.campaign_date,
    campaign_time: sanitizeText(campaign.campaign_time || '08:00', 20),
    location: sanitizeText(campaign.location || 'Hemominas - Juiz de Fora', 150),
    description: sanitizeText(campaign.description || '', 400),
    max_participants: campaign.max_participants || MAX_CAMPAIGN_PARTICIPANTS,
    confirmed_users: [],
  };

  const { error } = await supabase.from('donation_guides').insert([
    {
      title: `${CAMPAIGN_PREFIX}${cleanTitle}`,
      content: JSON.stringify(payload),
      updated_by: userId || null,
    },
  ]);

  return { error: error ? error.message : null };
}

/**
 * Remove uma campanha de doação em massa — Exclusivo para ADMs.
 */
export async function deleteGroupCampaign(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('donation_guides').delete().eq('id', id);
  return { error: error ? error.message : null };
}

/**
 * Remove um participante da confirmação de presença no mutirão — Exclusivo para ADMs.
 */
export async function adminRemoveCampaignParticipant(
  supabase: SupabaseClient,
  campaignId: string,
  participantId: string
): Promise<{ error: string | null }> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('donation_guides')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { error: 'Mutirão não encontrado.' };
    }

    const currentContent = JSON.parse(existing.content || '{}');
    const existingList: any[] = Array.isArray(currentContent.confirmed_users)
      ? currentContent.confirmed_users
      : [];
    const updatedList = existingList.filter((u: any) => u.id !== participantId);

    const { error: updateErr } = await supabase
      .from('donation_guides')
      .update({
        content: JSON.stringify({
          ...currentContent,
          confirmed_users: updatedList,
        }),
      })
      .eq('id', campaignId);

    return { error: updateErr ? updateErr.message : null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao remover participante.' };
  }
}

/**
 * Atualiza ou reagenda uma campanha de doação em massa — Exclusivo para ADMs.
 */
export async function updateGroupCampaign(
  supabase: SupabaseClient,
  id: string,
  campaign: Partial<GroupCampaign>,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('donation_guides')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return { error: 'Mutirão não encontrado.' };
    }

    const currentContent = JSON.parse(existing.content || '{}');
    const cleanTitle = campaign.title ? sanitizeText(campaign.title, 120) : currentContent.title;
    const oldDate = currentContent.campaign_date;
    const newDate = campaign.campaign_date || currentContent.campaign_date;

    const payload = {
      ...currentContent,
      title: cleanTitle,
      campaign_date: newDate,
      campaign_time: campaign.campaign_time !== undefined ? sanitizeText(campaign.campaign_time, 20) : currentContent.campaign_time,
      location: campaign.location !== undefined ? sanitizeText(campaign.location, 150) : currentContent.location,
      description: campaign.description !== undefined ? sanitizeText(campaign.description, 400) : currentContent.description,
      max_participants: campaign.max_participants || currentContent.max_participants || MAX_CAMPAIGN_PARTICIPANTS,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('donation_guides')
      .update({
        title: `${CAMPAIGN_PREFIX}${cleanTitle}`,
        content: JSON.stringify(payload),
        updated_by: userId || null,
      })
      .eq('id', id);

    // Se houve reagendamento de data, cria um aviso do sistema para alertar a comunidade
    if (!error && oldDate && newDate && oldDate !== newDate) {
      const oldDStr = parseSafeDate(oldDate)?.toLocaleDateString('pt-BR') || oldDate;
      const newDStr = parseSafeDate(newDate)?.toLocaleDateString('pt-BR') || newDate;
      await createSystemNotice(
        supabase,
        `📅 Mutirão Reagendado: ${cleanTitle}`,
        `A data do mutirão "${cleanTitle}" foi alterada de ${oldDStr} para ${newDStr}. Verifique suas datas e confirme presença.`,
        userId
      );
    }

    return { error: error ? error.message : null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao atualizar mutirão.' };
  }
}

/**
 * ============================================================================
 * REDE DE APOIO (SOS DOAÇÃO DE SANGUE)
 * ============================================================================
 */

/**
 * Busca todas as campanhas de apoio de pessoas que estão precisando de sangue.
 */
export async function fetchSupportCampaigns(supabase: SupabaseClient): Promise<SupportCampaign[]> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('*')
      .like('title', `${SUPPORT_PREFIX}%`)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const list: SupportCampaign[] = [];
    for (const row of data) {
      try {
        const parsed = JSON.parse(row.content);
        if (parsed && parsed.patient_name) {
          list.push({
            id: row.id,
            patient_name: sanitizeText(parsed.patient_name, 120),
            hospital: sanitizeText(parsed.hospital, 150),
            city: sanitizeText(parsed.city || 'Juiz de Fora - MG', 100),
            blood_type_needed: (parsed.blood_type_needed || 'Qualquer Tipo').toUpperCase(),
            urgency: parsed.urgency || 'Urgente',
            description: sanitizeText(parsed.description || '', 500),
            contact_info: sanitizeText(parsed.contact_info || '', 150),
            created_at: parsed.created_at || row.created_at,
            status: parsed.status === 'Concluída' ? 'Concluída' : 'Ativa',
          });
        }
      } catch {
        // Ignora JSON mal formatado
      }
    }

    return list;
  } catch {
    return [];
  }
}

/**
 * Cria uma nova solicitação na Rede de Apoio SOS.
 */
export async function createSupportCampaign(
  supabase: SupabaseClient,
  campaign: Omit<SupportCampaign, 'id'>,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const cleanPatient = sanitizeText(campaign.patient_name, 120);
    const payload: Omit<SupportCampaign, 'id'> = {
      patient_name: cleanPatient,
      hospital: sanitizeText(campaign.hospital, 150),
      city: sanitizeText(campaign.city || 'Juiz de Fora - MG', 100),
      blood_type_needed: (campaign.blood_type_needed || 'Qualquer Tipo').toUpperCase(),
      urgency: campaign.urgency || 'Urgente',
      description: sanitizeText(campaign.description || '', 500),
      contact_info: sanitizeText(campaign.contact_info || '', 150),
      created_at: new Date().toISOString(),
      status: 'Ativa',
    };

    const { error } = await supabase.from('donation_guides').insert([
      {
        title: `${SUPPORT_PREFIX}${cleanPatient}`,
        content: JSON.stringify(payload),
        updated_by: userId || null,
      },
    ]);

    // Dispara notificação automática de Rede de Apoio para a comunidade
    if (!error) {
      await createSystemNotice(
        supabase,
        `🚨 SOS Sangue: ${cleanPatient} precisa de doação (${payload.blood_type_needed})`,
        `Paciente internado no ${payload.hospital}. Se você tiver tipo sanguíneo compatível e estiver em dia com seu intervalo, faça sua doação e ajude a salvar essa vida!`,
        userId
      );
    }

    return { error: error ? error.message : null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao registrar pedido de apoio.' };
  }
}

/**
 * Atualiza status ou dados de um pedido de apoio.
 */
export async function updateSupportCampaign(
  supabase: SupabaseClient,
  id: string,
  campaign: Partial<SupportCampaign>,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('donation_guides')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existing) return { error: 'Campanha SOS não encontrada.' };

    const current = JSON.parse(existing.content || '{}');
    const updated = {
      ...current,
      ...campaign,
      patient_name: campaign.patient_name ? sanitizeText(campaign.patient_name, 120) : current.patient_name,
      hospital: campaign.hospital ? sanitizeText(campaign.hospital, 150) : current.hospital,
      description: campaign.description ? sanitizeText(campaign.description, 500) : current.description,
      contact_info: campaign.contact_info ? sanitizeText(campaign.contact_info, 150) : current.contact_info,
    };

    const { error } = await supabase
      .from('donation_guides')
      .update({
        title: `${SUPPORT_PREFIX}${updated.patient_name}`,
        content: JSON.stringify(updated),
        updated_by: userId || null,
      })
      .eq('id', id);

    return { error: error ? error.message : null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao atualizar campanha.' };
  }
}

/**
 * Exclui uma campanha de apoio.
 */
export async function deleteSupportCampaign(
  supabase: SupabaseClient,
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('donation_guides').delete().eq('id', id);
  return { error: error ? error.message : null };
}

/**
 * ============================================================================
 * COMUNICADOS DO SISTEMA E CENTRAL DE NOTIFICAÇÕES
 * ============================================================================
 */

/**
 * Publica um comunicado ou aviso de ajuste no aplicativo.
 */
export async function createSystemNotice(
  supabase: SupabaseClient,
  title: string,
  message: string,
  userId?: string
): Promise<{ error: string | null }> {
  try {
    const cleanTitle = sanitizeText(title, 140);
    const payload = {
      title: cleanTitle,
      message: sanitizeText(message, 600),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('donation_guides').insert([
      {
        title: `${NOTICE_PREFIX}${cleanTitle}`,
        content: JSON.stringify(payload),
        updated_by: userId || null,
      },
    ]);

    return { error: error ? error.message : null };
  } catch (e: any) {
    return { error: e?.message || 'Erro ao criar aviso.' };
  }
}

const USER_NOTIF_PREFIX = '[NOTIF_USER] ';

export async function sendUserBadgeNotification(
  supabase: SupabaseClient,
  userId: string,
  badgeTitle: string,
  badgeMessage: string,
  adminId?: string
) {
  try {
    const payload = {
      target_user_id: userId,
      type: 'medalha',
      title: sanitizeText(badgeTitle, 140),
      message: sanitizeText(badgeMessage, 600),
      link: '/doador/colecao',
      created_at: new Date().toISOString(),
    };
    await supabase.from('donation_guides').insert([
      {
        title: `${USER_NOTIF_PREFIX}${userId}`,
        content: JSON.stringify(payload),
        updated_by: adminId || null,
      },
    ]);
  } catch (e) {
    console.error('Erro ao enviar notificacao de medalha:', e);
  }
}

/**
 * Busca todas as notificações unificadas para o usuário:
 * 1. Campanhas SOS (com indicação se o usuário tem sangue compatível e está apto)
 * 2. Avisos do sistema e ajustes no app
 * 3. Notificações pessoais de medalhas especiais liberadas pela coordenação
 * 4. Notícias recentes publicadas pela coordenação
 */
export async function fetchUnifiedNotifications(
  supabase: SupabaseClient,
  userProfile?: {
    id: string;
    blood_type?: string | null;
    sex?: string | null;
    last_donation_date?: string | null;
  }
): Promise<AppNotification[]> {
  try {
    const [noticesRes, supportRes, newsRes, userNotifsRes] = await Promise.all([
      supabase
        .from('donation_guides')
        .select('*')
        .like('title', `${NOTICE_PREFIX}%`)
        .order('created_at', { ascending: false })
        .limit(10),
      fetchSupportCampaigns(supabase),
      supabase
        .from('news')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(8),
      userProfile?.id
        ? supabase
            .from('donation_guides')
            .select('*')
            .eq('title', `${USER_NOTIF_PREFIX}${userProfile.id}`)
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),
    ]);

    const notifications: AppNotification[] = [];

    // 1. Notificações pessoais de medalhas especiais liberadas pelo administrador
    if (userNotifsRes.data) {
      for (const row of userNotifsRes.data) {
        try {
          const parsed = JSON.parse(row.content);
          notifications.push({
            id: row.id,
            type: 'medalha',
            title: sanitizeText(parsed.title || 'Nova Medalha Liberada!', 140),
            message: sanitizeText(parsed.message || '', 600),
            link: parsed.link || '/doador/colecao',
            created_at: parsed.created_at || row.created_at,
            is_urgent: true,
          });
        } catch {
          // Ignora
        }
      }
    }

    // 1. Notificações da Rede de Apoio SOS (Ativas)
    const activeSos = supportRes.filter(
      (s) => s.status === 'Ativa' && !s.patient_name.toLowerCase().includes('teste')
    );
    for (const sos of activeSos) {
      const isCompatible = userProfile?.blood_type
        ? canDonateBlood(userProfile.blood_type, sos.blood_type_needed)
        : false;

      const elig = userProfile
        ? checkEligibilityForDate(userProfile.sex || 'M', userProfile.last_donation_date, new Date())
        : { isEligible: true };

      let message = `${sos.patient_name} precisa de doação no ${sos.hospital}. Tipo: ${sos.blood_type_needed}.`;
      if (isCompatible && elig.isEligible) {
        message = `🚨 SEU SANGUE É COMPATÍVEL! Você está liberado para doar e pode ajudar a salvar ${sos.patient_name} no ${sos.hospital}.`;
      } else if (isCompatible && !elig.isEligible) {
        message = `Seu tipo sanguíneo é compatível com ${sos.patient_name}, mas você está em intervalo. Se puder, ajude a compartilhar!`;
      }

      notifications.push({
        id: `sos-${sos.id}`,
        type: 'sos',
        title: `SOS Sangue: ${sos.patient_name} (${sos.blood_type_needed})`,
        message,
        link: '/doador#rede-apoio',
        created_at: sos.created_at || new Date().toISOString(),
        is_urgent: isCompatible && elig.isEligible,
      });
    }

    // 2. Avisos e Comunicados do Sistema (ignora avisos de teste)
    if (noticesRes.data) {
      for (const row of noticesRes.data) {
        try {
          const parsed = JSON.parse(row.content);
          const rawTitle = parsed.title || row.title.replace(NOTICE_PREFIX, '');
          if (rawTitle.toLowerCase().includes('teste') || (parsed.message && parsed.message.toLowerCase().includes('teste'))) {
            continue;
          }
          notifications.push({
            id: row.id,
            type: 'sistema',
            title: sanitizeText(rawTitle, 140),
            message: sanitizeText(parsed.message || '', 600),
            created_at: parsed.created_at || row.created_at,
            is_urgent: false,
          });
        } catch {
          // Ignora
        }
      }
    }

    // 3. Notícias recentes
    if (newsRes.data) {
      for (const n of newsRes.data) {
        notifications.push({
          id: `news-${n.id}`,
          type: 'noticia',
          title: n.title,
          message: n.subtitle || (n.content ? n.content.slice(0, 120) + '...' : 'Confira no Mural.'),
          link: '/doador#novidades',
          created_at: n.created_at,
          is_urgent: false,
        });
      }
    }

    // Ordena as mais recentes primeiro, priorizando as urgentes no topo
    return notifications.sort((a, b) => {
      if (a.is_urgent && !b.is_urgent) return -1;
      if (!a.is_urgent && b.is_urgent) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } catch {
    return [];
  }
}

/**
 * Busca as configurações públicas do projeto (Link do Canal do WhatsApp, etc.).
 */
export async function fetchProjectConfig(supabase: SupabaseClient): Promise<ProjectConfig> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('*')
      .eq('title', CONFIG_KEY)
      .maybeSingle();

    if (error || !data) return DEFAULT_PROJECT_CONFIG;

    const parsed = JSON.parse(data.content);
    return {
      id: data.id,
      whatsappGroupUrl: parsed.whatsappGroupUrl || DEFAULT_PROJECT_CONFIG.whatsappGroupUrl,
      hemocenterName: parsed.hemocenterName || DEFAULT_PROJECT_CONFIG.hemocenterName,
      hemocenterPhone: parsed.hemocenterPhone || DEFAULT_PROJECT_CONFIG.hemocenterPhone,
      hemocenterScheduleUrl: parsed.hemocenterScheduleUrl || DEFAULT_PROJECT_CONFIG.hemocenterScheduleUrl,
    };
  } catch {
    return DEFAULT_PROJECT_CONFIG;
  }
}

/**
 * Salva as configurações públicas do projeto — Exclusivo para ADMs.
 */
export async function saveProjectConfig(
  supabase: SupabaseClient,
  config: ProjectConfig,
  userId?: string
): Promise<{ error: string | null }> {
  const payload = {
    whatsappGroupUrl: config.whatsappGroupUrl.trim(),
    hemocenterName: sanitizeText(config.hemocenterName, 150),
    hemocenterPhone: sanitizeText(config.hemocenterPhone, 40),
    hemocenterScheduleUrl: config.hemocenterScheduleUrl.trim(),
  };

  const existing = await fetchProjectConfig(supabase);
  if (existing.id) {
    const { error } = await supabase
      .from('donation_guides')
      .update({
        content: JSON.stringify(payload),
        updated_by: userId || null,
      })
      .eq('id', existing.id);
    return { error: error ? error.message : null };
  } else {
    const { error } = await supabase.from('donation_guides').insert([
      {
        title: CONFIG_KEY,
        content: JSON.stringify(payload),
        updated_by: userId || null,
      },
    ]);
    return { error: error ? error.message : null };
  }
}

const SPECIAL_BADGES_KEY = '[MEDALHAS_ESPECIAIS]';

export interface UserSpecialBadges {
  isFounder?: boolean;
  founderGrantedAt?: string;
  isSosHero?: boolean;
  sosHeroGrantedAt?: string;
  mutiraoIds?: string[]; // IDs das campanhas de mutirão com medalha concedida
}

export async function fetchSpecialBadgesStore(
  supabase: SupabaseClient
): Promise<{ id?: string; store: Record<string, UserSpecialBadges> }> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('*')
      .eq('title', SPECIAL_BADGES_KEY)
      .maybeSingle();

    if (error || !data) return { store: {} };
    const parsed = JSON.parse(data.content || '{}');
    return { id: data.id, store: parsed };
  } catch {
    return { store: {} };
  }
}

export async function fetchUserSpecialBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSpecialBadges> {
  const { store } = await fetchSpecialBadgesStore(supabase);
  return store[userId] || {};
}

export async function saveUserSpecialBadges(
  supabase: SupabaseClient,
  userId: string,
  badges: UserSpecialBadges,
  adminId?: string
): Promise<{ error: string | null }> {
  const { id: storeRowId, store } = await fetchSpecialBadgesStore(supabase);
  store[userId] = {
    ...store[userId],
    ...badges,
  };

  const payload = JSON.stringify(store);
  if (storeRowId) {
    const { error } = await supabase
      .from('donation_guides')
      .update({ content: payload, updated_by: adminId || null })
      .eq('id', storeRowId);
    return { error: error ? error.message : null };
  } else {
    const { error } = await supabase
      .from('donation_guides')
      .insert([{ title: SPECIAL_BADGES_KEY, content: payload, updated_by: adminId || null }]);
    return { error: error ? error.message : null };
  }
}

export async function toggleUserSpecialBadge(
  supabase: SupabaseClient,
  userId: string,
  badgeKey: 'isFounder' | 'isSosHero',
  adminId?: string
): Promise<{ error: string | null; newState: boolean }> {
  const current = await fetchUserSpecialBadges(supabase, userId);
  const newState = !current[badgeKey];
  const update: UserSpecialBadges = {
    ...current,
    [badgeKey]: newState,
    ...(badgeKey === 'isFounder' && newState ? { founderGrantedAt: new Date().toISOString() } : {}),
    ...(badgeKey === 'isSosHero' && newState ? { sosHeroGrantedAt: new Date().toISOString() } : {}),
  };
  const { error } = await saveUserSpecialBadges(supabase, userId, update, adminId);

  // Se a medalha foi concedida, envia a notificação comemorativa para o doador
  if (!error && newState) {
    if (badgeKey === 'isFounder') {
      await sendUserBadgeNotification(
        supabase,
        userId,
        '⭐ Nova Medalha Desbloqueada: Membro Fundador!',
        'Parabéns! A coordenação liberou a honraria de Membro Fundador do Movimento O Bom Amigo (2026) para você. Confira em sua coleção de medalhas!',
        adminId
      );
    } else if (badgeKey === 'isSosHero') {
      await sendUserBadgeNotification(
        supabase,
        userId,
        '🩸 Nova Medalha Desbloqueada: Herói da Rede SOS!',
        'Sua doação solidária direcionada foi registrada pela coordenação. Você conquistou a medalha especial de Herói da Rede de Apoio SOS!',
        adminId
      );
    }
  }

  return { error, newState };
}

export async function toggleUserMutiraoBadge(
  supabase: SupabaseClient,
  userId: string,
  mutiraoId: string,
  mutiraoTitleName?: string,
  adminId?: string
): Promise<{ error: string | null; hasBadge: boolean }> {
  const current = await fetchUserSpecialBadges(supabase, userId);
  const currentList = Array.isArray(current.mutiraoIds) ? current.mutiraoIds : [];
  const alreadyHas = currentList.includes(mutiraoId);
  const updatedList = alreadyHas
    ? currentList.filter((id) => id !== mutiraoId)
    : [...currentList, mutiraoId];

  const { error } = await saveUserSpecialBadges(
    supabase,
    userId,
    { ...current, mutiraoIds: updatedList },
    adminId
  );

  // Se a medalha do mutirão foi liberada, envia notificação comemorativa para o doador
  if (!error && !alreadyHas) {
    const title = mutiraoTitleName || 'Mutirão O Bom Amigo';
    await sendUserBadgeNotification(
      supabase,
      userId,
      `🏅 Nova Medalha Desbloqueada: ${title}!`,
      `Sua presença e doação no ${title} foram confirmadas pela coordenação após o encerramento da campanha. Sua medalha exclusiva já está disponível na sua galeria!`,
      adminId
    );
  }

  return { error, hasBadge: !alreadyHas };
}

export async function grantBatchFounderBadges(
  supabase: SupabaseClient,
  userIds: string[],
  grant: boolean,
  adminId?: string
): Promise<{ error: string | null }> {
  const { id: storeRowId, store } = await fetchSpecialBadgesStore(supabase);
  const now = new Date().toISOString();
  userIds.forEach((uid) => {
    store[uid] = {
      ...store[uid],
      isFounder: grant,
      founderGrantedAt: grant ? now : undefined,
    };
  });

  const payload = JSON.stringify(store);
  if (storeRowId) {
    const { error } = await supabase
      .from('donation_guides')
      .update({ content: payload, updated_by: adminId || null })
      .eq('id', storeRowId);
    return { error: error ? error.message : null };
  } else {
    const { error } = await supabase
      .from('donation_guides')
      .insert([{ title: SPECIAL_BADGES_KEY, content: payload, updated_by: adminId || null }]);
    return { error: error ? error.message : null };
  }
}

export async function grantBatchMutiraoBadges(
  supabase: SupabaseClient,
  userIds: string[],
  mutiraoId: string,
  adminId?: string
): Promise<{ error: string | null }> {
  const { id: storeRowId, store } = await fetchSpecialBadgesStore(supabase);
  userIds.forEach((uid) => {
    const currentList = Array.isArray(store[uid]?.mutiraoIds) ? store[uid].mutiraoIds! : [];
    if (!currentList.includes(mutiraoId)) {
      store[uid] = {
        ...store[uid],
        mutiraoIds: [...currentList, mutiraoId],
      };
    }
  });

  const payload = JSON.stringify(store);
  if (storeRowId) {
    const { error } = await supabase
      .from('donation_guides')
      .update({ content: payload, updated_by: adminId || null })
      .eq('id', storeRowId);
    return { error: error ? error.message : null };
  } else {
    const { error } = await supabase
      .from('donation_guides')
      .insert([{ title: SPECIAL_BADGES_KEY, content: payload, updated_by: adminId || null }]);
    return { error: error ? error.message : null };
  }
}

const STATS_KEY = '[STATS_DOACOES]';

export interface DonationStats {
  totalDonations: number;
  totalMl: number;
  totalLiters: number;
  totalLives: number;
  startDate: string;
}

/**
 * Retorna as estatísticas públicas acumuladas de sangue doado desde 12/09/2026.
 * Cada doação registrada soma 450 ml de sangue doado.
 */
export async function fetchPublicDonationStats(supabase: SupabaseClient): Promise<DonationStats> {
  let count = 0;

  // 1. Tenta RPC oficial de estatísticas públicas (executável por anon ou authenticated)
  try {
    const { data: rpcStats, error: rpcErr } = await supabase.rpc('get_public_donation_stats');
    if (!rpcErr && rpcStats && typeof rpcStats.totalDonations === 'number') {
      return {
        totalDonations: rpcStats.totalDonations,
        totalMl: rpcStats.totalMl ?? rpcStats.totalDonations * 450,
        totalLiters: rpcStats.totalLiters ?? (rpcStats.totalDonations * 450) / 1000,
        totalLives: rpcStats.totalLives ?? rpcStats.totalDonations * 4,
        startDate: rpcStats.startDate || '12/09/2026',
      };
    }
  } catch {}

  // 2. Consulta direta em donations (quando logado)
  try {
    const { count: directCount, error } = await supabase
      .from('donations')
      .select('id', { count: 'exact', head: true });
    if (!error && typeof directCount === 'number' && directCount > 0) {
      count = directCount;
    }
  } catch {}

  // 3. Fallback via store público em donation_guides (ordem decrescente, sem maybeSingle para não falhar com múltiplas linhas)
  if (count === 0) {
    try {
      const { data: storeRows } = await supabase
        .from('donation_guides')
        .select('content')
        .eq('title', STATS_KEY)
        .order('created_at', { ascending: false })
        .limit(10);

      if (storeRows && storeRows.length > 0) {
        for (const row of storeRows) {
          try {
            const parsed = JSON.parse(row.content);
            if (typeof parsed?.totalDonations === 'number') {
              count = Math.max(count, parsed.totalDonations);
            }
          } catch {}
        }
      }
    } catch {}
  }

  const totalMl = count * 450;
  const totalLiters = totalMl / 1000;
  const totalLives = count * 4;

  return {
    totalDonations: count,
    totalMl,
    totalLiters,
    totalLives,
    startDate: '12/09/2026',
  };
}

/**
 * Atualiza o store público com a contagem total de doações acumuladas
 */
export async function syncGlobalDonationsCount(
  supabase: SupabaseClient,
  knownTotal?: number
): Promise<void> {
  try {
    let finalCount = knownTotal;
    if (finalCount === undefined) {
      const { count } = await supabase
        .from('donations')
        .select('id', { count: 'exact', head: true });
      if (typeof count === 'number') {
        finalCount = count;
      }
    }

    if (typeof finalCount !== 'number') return;

    const payload = JSON.stringify({
      totalDonations: finalCount,
      updatedAt: new Date().toISOString(),
    });

    const { data: existingRows } = await supabase
      .from('donation_guides')
      .select('id')
      .eq('title', STATS_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingRows && existingRows.length > 0 && existingRows[0].id) {
      await supabase
        .from('donation_guides')
        .update({ content: payload })
        .eq('id', existingRows[0].id);
    } else {
      await supabase
        .from('donation_guides')
        .insert([{ title: STATS_KEY, content: payload }]);
    }
  } catch {}
}
