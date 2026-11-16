import { SupabaseClient } from '@supabase/supabase-js';

export const SHIRT_CONFIG_KEY = '[CONFIG_CAMISA]';
export const SHIRT_ORDER_PREFIX = '[PEDIDO_CAMISA] ';

export interface ShirtConfig {
  price: number;
  imageUrl: string;
  pixKey: string;
  pixReceiver: string;
  pixBank?: string;
  isActive: boolean;
  deadline?: string;
  deliveryInfo?: string;
  description?: string;
}

export const DEFAULT_SHIRT_CONFIG: ShirtConfig = {
  price: 45.0,
  imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
  pixKey: 'contato@movimentooba.com.br',
  pixReceiver: 'Movimento O Bom Amigo',
  pixBank: 'Banco Inter / NuBank',
  isActive: true,
  deadline: 'A combinar com a coordenação',
  deliveryInfo: 'Entrega presencial nos mutirões de doação ou no Hemominas.',
  description: 'Camisa oficial 100% algodão premium com a estampa exclusiva do Movimento O Bom Amigo.',
};

export type ShirtSize =
  | 'PP'
  | 'P'
  | 'M'
  | 'G'
  | 'GG'
  | 'XGG'
  | 'Babylook P'
  | 'Babylook M'
  | 'Babylook G'
  | 'Babylook GG'
  | 'Infantil 10'
  | 'Infantil 12'
  | 'Infantil 14';

export const AVAILABLE_SHIRT_SIZES: ShirtSize[] = [
  'PP',
  'P',
  'M',
  'G',
  'GG',
  'XGG',
  'Babylook P',
  'Babylook M',
  'Babylook G',
  'Babylook GG',
  'Infantil 10',
  'Infantil 12',
  'Infantil 14',
];

export interface ShirtOrder {
  id?: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  userBloodType?: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: 'pendente' | 'sinal' | 'pago' | 'entregue';
  amountPaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Busca as configurações gerais da camisa oficial do grupo
 */
export async function fetchShirtConfig(supabase: SupabaseClient): Promise<ShirtConfig> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('content')
      .eq('title', SHIRT_CONFIG_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return DEFAULT_SHIRT_CONFIG;
    }

    const parsed = JSON.parse(data[0].content);
    return {
      ...DEFAULT_SHIRT_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_SHIRT_CONFIG;
  }
}

/**
 * Salva ou atualiza as configurações da camisa oficial (apenas ADM)
 */
export async function saveShirtConfig(
  supabase: SupabaseClient,
  config: Partial<ShirtConfig>
): Promise<boolean> {
  try {
    const current = await fetchShirtConfig(supabase);
    const updated: ShirtConfig = { ...current, ...config };
    const payload = JSON.stringify(updated);

    const { data: existing } = await supabase
      .from('donation_guides')
      .select('id')
      .eq('title', SHIRT_CONFIG_KEY)
      .limit(1);

    if (existing && existing.length > 0 && existing[0].id) {
      const { error } = await supabase
        .from('donation_guides')
        .update({ content: payload })
        .eq('id', existing[0].id);
      return !error;
    } else {
      const { error } = await supabase
        .from('donation_guides')
        .insert([{ title: SHIRT_CONFIG_KEY, content: payload }]);
      return !error;
    }
  } catch {
    return false;
  }
}

/**
 * Busca o pedido de camisa de um usuário específico
 */
export async function fetchUserShirtOrder(
  supabase: SupabaseClient,
  userId: string
): Promise<ShirtOrder | null> {
  try {
    const titleKey = `${SHIRT_ORDER_PREFIX}${userId}`;
    const { data, error } = await supabase
      .from('donation_guides')
      .select('id, content, created_at, updated_at')
      .eq('title', titleKey)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const row = data[0];
    const parsed: ShirtOrder = JSON.parse(row.content);
    return {
      ...parsed,
      id: row.id,
      createdAt: parsed.createdAt || row.created_at,
      updatedAt: parsed.updatedAt || row.updated_at,
    };
  } catch {
    return null;
  }
}

/**
 * Salva ou atualiza a solicitação de camisa do usuário
 */
export async function saveUserShirtOrder(
  supabase: SupabaseClient,
  orderData: Omit<ShirtOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ShirtOrder | null> {
  try {
    const titleKey = `${SHIRT_ORDER_PREFIX}${orderData.userId}`;
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('donation_guides')
      .select('id, content')
      .eq('title', titleKey)
      .limit(1);

    let existingOrder: Partial<ShirtOrder> = {};
    if (existing && existing.length > 0 && existing[0].content) {
      try {
        existingOrder = JSON.parse(existing[0].content);
      } catch {}
    }

    const finalOrder: ShirtOrder = {
      ...existingOrder,
      ...orderData,
      createdAt: existingOrder.createdAt || now,
      updatedAt: now,
    };

    const payload = JSON.stringify(finalOrder);

    if (existing && existing.length > 0 && existing[0].id) {
      const { error } = await supabase
        .from('donation_guides')
        .update({ content: payload })
        .eq('id', existing[0].id);

      if (error) return null;
      return { ...finalOrder, id: existing[0].id };
    } else {
      const { data: inserted, error } = await supabase
        .from('donation_guides')
        .insert([{ title: titleKey, content: payload }])
        .select('id')
        .single();

      if (error) return null;
      return { ...finalOrder, id: inserted?.id };
    }
  } catch {
    return null;
  }
}

/**
 * Cancela a solicitação de camisa do usuário
 */
export async function cancelUserShirtOrder(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const titleKey = `${SHIRT_ORDER_PREFIX}${userId}`;
    const { error } = await supabase
      .from('donation_guides')
      .delete()
      .eq('title', titleKey);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Busca todos os pedidos de camisa cadastrados para o painel de gestão
 */
export async function fetchAllShirtOrders(supabase: SupabaseClient): Promise<ShirtOrder[]> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('id, title, content, created_at, updated_at')
      .like('title', `${SHIRT_ORDER_PREFIX}%`)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const orders: ShirtOrder[] = [];
    for (const row of data) {
      try {
        const parsed: ShirtOrder = JSON.parse(row.content);
        const userId = row.title.replace(SHIRT_ORDER_PREFIX, '').trim();
        orders.push({
          ...parsed,
          id: row.id,
          userId: parsed.userId || userId,
          createdAt: parsed.createdAt || row.created_at,
          updatedAt: parsed.updatedAt || row.updated_at,
        });
      } catch {}
    }

    return orders;
  } catch {
    return [];
  }
}

/**
 * Atualiza o status de pagamento e valor pago de um pedido específico (pelo Super Admin)
 */
export async function updateShirtOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  paymentStatus: ShirtOrder['paymentStatus'],
  amountPaid: number,
  adminNotes?: string
): Promise<boolean> {
  try {
    const { data, error: fetchErr } = await supabase
      .from('donation_guides')
      .select('content')
      .eq('id', orderId)
      .single();

    if (fetchErr || !data) return false;

    const parsed: ShirtOrder = JSON.parse(data.content);
    parsed.paymentStatus = paymentStatus;
    parsed.amountPaid = amountPaid;
    if (adminNotes !== undefined) {
      parsed.notes = adminNotes;
    }
    parsed.updatedAt = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('donation_guides')
      .update({ content: JSON.stringify(parsed) })
      .eq('id', orderId);

    return !updateErr;
  } catch {
    return false;
  }
}
