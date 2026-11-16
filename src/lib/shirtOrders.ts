import { SupabaseClient } from '@supabase/supabase-js';

export const SHIRT_CONFIG_KEY = '[CONFIG_CAMISA]';
export const PRODUCTS_CATALOG_KEY = '[CATALOGO_PRODUTOS_OFICIAIS]';
export const SHIRT_ORDER_PREFIX = '[PEDIDO_CAMISA] ';

export type CampaignPhase = 'inativo' | 'pre_save' | 'oficial' | 'encomendado';

export interface OfficialProduct {
  id: string;
  name: string;
  description?: string;
  hasSizes: boolean; // true para Camisa/Vestuário, false para Caneca/Outros
  imageUrl: string; // vazio até o admin subir a arte
  phase: CampaignPhase;
  preSaveDeadline?: string; // YYYY-MM-DD
  price: number;
  pixKey: string;
  pixReceiver: string;
  pixBank?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShirtConfig {
  campaignPhase: CampaignPhase;
  isPriceDefined: boolean;
  price: number;
  estimatedPrice?: string;
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
  campaignPhase: 'inativo',
  isPriceDefined: false,
  price: 0,
  estimatedPrice: 'A definir após o Pré-Save',
  imageUrl: '',
  pixKey: 'contato@movimentooba.com.br',
  pixReceiver: 'Movimento O Bom Amigo',
  pixBank: '',
  isActive: false,
  deadline: '',
  deliveryInfo: 'Entrega presencial nos mutirões de doação.',
  description: '',
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

export type PaymentStatus = 'pre_save' | 'pendente' | 'sinal' | 'pago' | 'entregue';

export interface ShirtOrder {
  id?: string;
  productId?: string;
  productName?: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  userBloodType?: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Verifica se o produto está visível para os membros solicitarem no app.
 */
export function isProductVisibleToMembers(product: OfficialProduct): boolean {
  if (product.phase === 'inativo' || product.phase === 'encomendado') {
    return false;
  }
  if (product.phase === 'pre_save' && product.preSaveDeadline) {
    const parts = product.preSaveDeadline.split('-');
    if (parts.length === 3) {
      const deadlineDate = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
        23,
        59,
        59
      );
      if (new Date() > deadlineDate) {
        return false;
      }
    }
  }
  return product.phase === 'pre_save' || product.phase === 'oficial';
}

/**
 * Formata uma data YYYY-MM-DD para DD/MM/AAAA
 */
export function formatDeadlineBR(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Busca a lista de todos os produtos oficiais cadastrados pelo Admin
 */
export async function fetchOfficialProducts(
  supabase: SupabaseClient
): Promise<OfficialProduct[]> {
  try {
    const { data, error } = await supabase
      .from('donation_guides')
      .select('content')
      .eq('title', PRODUCTS_CATALOG_KEY)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      const parsed = JSON.parse(data[0].content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Salva a lista completa de produtos oficiais no banco
 */
export async function saveOfficialProducts(
  supabase: SupabaseClient,
  products: OfficialProduct[]
): Promise<boolean> {
  try {
    const payload = JSON.stringify(products);
    const { data: existing } = await supabase
      .from('donation_guides')
      .select('id')
      .eq('title', PRODUCTS_CATALOG_KEY)
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
        .insert([{ title: PRODUCTS_CATALOG_KEY, content: payload }]);
      return !error;
    }
  } catch {
    return false;
  }
}

/**
 * Busca os pedidos de um usuário específico (lendo de donation_guides e profiles.theme_preference)
 */
export async function fetchUserProductOrders(
  supabase: SupabaseClient,
  userId: string
): Promise<ShirtOrder[]> {
  try {
    const ordersMap = new Map<string, ShirtOrder>();

    // 1. Lê do próprio perfil do usuário (profiles.theme_preference)
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, name, blood_type, theme_preference')
      .eq('id', userId)
      .maybeSingle();

    if (prof?.theme_preference && prof.theme_preference.startsWith('{')) {
      try {
        const parsedPref = JSON.parse(prof.theme_preference);
        if (Array.isArray(parsedPref.product_orders)) {
          for (const ord of parsedPref.product_orders) {
            if (ord && ord.userId === userId) {
              const key = `${ord.productId || 'default'}_${userId}`;
              ordersMap.set(key, {
                ...ord,
                id: ord.id || key,
              });
            }
          }
        }
      } catch {}
    }

    // 2. Lê também de donation_guides (caso atualizado pelo Admin com status de pagamento)
    const { data: guidesData } = await supabase
      .from('donation_guides')
      .select('id, title, content, created_at, updated_at')
      .like('title', `${SHIRT_ORDER_PREFIX}%${userId}`);

    if (guidesData) {
      for (const row of guidesData) {
        try {
          const parsed: ShirtOrder = JSON.parse(row.content);
          const key = `${parsed.productId || 'default'}_${userId}`;
          const existing = ordersMap.get(key);
          const rowUpdated = parsed.updatedAt || row.updated_at || '';
          if (!existing || rowUpdated >= (existing.updatedAt || '')) {
            ordersMap.set(key, {
              ...parsed,
              id: row.id,
              userId: parsed.userId || userId,
              createdAt: parsed.createdAt || row.created_at,
              updatedAt: rowUpdated,
            });
          }
        } catch {}
      }
    }

    return Array.from(ordersMap.values());
  } catch {
    return [];
  }
}

/**
 * Salva ou atualiza a solicitação de um produto oficial pelo usuário.
 * Persiste tanto em profiles.theme_preference (permitido para qualquer membro logado)
 * quanto em donation_guides (quando permitido).
 */
export async function saveUserShirtOrder(
  supabase: SupabaseClient,
  orderData: Omit<ShirtOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ShirtOrder | null> {
  try {
    const prodKey = orderData.productId ? `${orderData.productId}_` : '';
    const titleKey = `${SHIRT_ORDER_PREFIX}${prodKey}${orderData.userId}`;
    const compositeId = `${orderData.productId || 'default'}_${orderData.userId}`;
    const now = new Date().toISOString();

    const finalOrder: ShirtOrder = {
      ...orderData,
      id: compositeId,
      createdAt: now,
      updatedAt: now,
    };

    let savedSuccessfully = false;

    // 1. Persiste em profiles.theme_preference (funciona para 100% dos membros logados via RLS do próprio perfil)
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', orderData.userId)
        .maybeSingle();

      let existingObj: Record<string, any> = {};
      let existingOrders: ShirtOrder[] = [];

      if (prof?.theme_preference && prof.theme_preference.startsWith('{')) {
        try {
          existingObj = JSON.parse(prof.theme_preference);
          if (Array.isArray(existingObj.product_orders)) {
            existingOrders = existingObj.product_orders;
          }
        } catch {}
      }

      const prevMatch = existingOrders.find(
        (o) => (o.productId || 'default') === (orderData.productId || 'default')
      );
      if (prevMatch?.createdAt) {
        finalOrder.createdAt = prevMatch.createdAt;
      }

      const otherOrders = existingOrders.filter(
        (o) => (o.productId || 'default') !== (orderData.productId || 'default')
      );

      const updatedThemePref = JSON.stringify({
        ...existingObj,
        product_orders: [finalOrder, ...otherOrders],
        updated_at: now,
      });

      const { error: profErr } = await supabase
        .from('profiles')
        .update({ theme_preference: updatedThemePref })
        .eq('id', orderData.userId);

      if (!profErr) {
        savedSuccessfully = true;
      }
    } catch {}

    // 2. Tenta também salvar em donation_guides
    try {
      const { data: existing } = await supabase
        .from('donation_guides')
        .select('id, content')
        .eq('title', titleKey)
        .limit(1);

      const payload = JSON.stringify(finalOrder);

      if (existing && existing.length > 0 && existing[0].id) {
        const { error } = await supabase
          .from('donation_guides')
          .update({ content: payload })
          .eq('id', existing[0].id);
        if (!error) {
          savedSuccessfully = true;
          finalOrder.id = existing[0].id;
        }
      } else {
        const { data: inserted, error } = await supabase
          .from('donation_guides')
          .insert([{ title: titleKey, content: payload }])
          .select('id')
          .single();
        if (!error && inserted?.id) {
          savedSuccessfully = true;
          finalOrder.id = inserted.id;
        }
      }
    } catch {}

    return savedSuccessfully ? finalOrder : null;
  } catch {
    return null;
  }
}

/**
 * Cancela a solicitação de um produto específico do usuário
 */
export async function cancelUserShirtOrder(
  supabase: SupabaseClient,
  userId: string,
  productId?: string
): Promise<boolean> {
  try {
    let ok = false;

    // 1. Remove de profiles.theme_preference
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('theme_preference')
        .eq('id', userId)
        .maybeSingle();

      if (prof?.theme_preference && prof.theme_preference.startsWith('{')) {
        const existingObj = JSON.parse(prof.theme_preference);
        if (Array.isArray(existingObj.product_orders)) {
          existingObj.product_orders = existingObj.product_orders.filter(
            (o: ShirtOrder) => (o.productId || 'default') !== (productId || 'default')
          );
          const { error: profErr } = await supabase
            .from('profiles')
            .update({ theme_preference: JSON.stringify(existingObj) })
            .eq('id', userId);
          if (!profErr) ok = true;
        }
      }
    } catch {}

    // 2. Remove de donation_guides se existir
    try {
      const prodKey = productId ? `${productId}_` : '';
      const titleKey = `${SHIRT_ORDER_PREFIX}${prodKey}${userId}`;
      const { error } = await supabase
        .from('donation_guides')
        .delete()
        .eq('title', titleKey);
      if (!error) ok = true;
    } catch {}

    return ok;
  } catch {
    return false;
  }
}

/**
 * Limpa os pedidos de um produto específico (usado opcionalmente ao reabilitar um novo lote do zero)
 */
export async function clearProductOrders(
  supabase: SupabaseClient,
  productId: string
): Promise<boolean> {
  try {
    const prodKey = `${productId}_`;
    await supabase
      .from('donation_guides')
      .delete()
      .like('title', `${SHIRT_ORDER_PREFIX}${prodKey}%`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Busca todos os pedidos de produtos oficiais (combinando profiles.theme_preference e donation_guides)
 */
export async function fetchAllShirtOrders(
  supabase: SupabaseClient,
  productId?: string
): Promise<ShirtOrder[]> {
  try {
    const ordersMap = new Map<string, ShirtOrder>();

    // 1. Lê pedidos salvos nos perfis dos membros (profiles.theme_preference)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, blood_type, theme_preference');

    if (profilesData) {
      for (const prof of profilesData) {
        if (prof.theme_preference && prof.theme_preference.startsWith('{')) {
          try {
            const parsedPref = JSON.parse(prof.theme_preference);
            if (Array.isArray(parsedPref.product_orders)) {
              for (const ord of parsedPref.product_orders) {
                if (ord) {
                  const uId = ord.userId || prof.id;
                  const key = `${ord.productId || 'default'}_${uId}`;
                  ordersMap.set(key, {
                    ...ord,
                    id: ord.id || key,
                    userId: uId,
                    userName: ord.userName || prof.name || 'Membro',
                    userBloodType: ord.userBloodType || prof.blood_type,
                  });
                }
              }
            }
          } catch {}
        }
      }
    }

    // 2. Lê pedidos salvos/atualizados pelo Admin em donation_guides
    const { data: guidesData } = await supabase
      .from('donation_guides')
      .select('id, title, content, created_at, updated_at')
      .like('title', `${SHIRT_ORDER_PREFIX}%`)
      .order('created_at', { ascending: false });

    if (guidesData) {
      for (const row of guidesData) {
        try {
          const parsed: ShirtOrder = JSON.parse(row.content);
          const suffix = row.title.replace(SHIRT_ORDER_PREFIX, '').trim();
          const uId = parsed.userId || suffix;
          const key = `${parsed.productId || 'default'}_${uId}`;
          const existing = ordersMap.get(key);
          const rowUpdated = parsed.updatedAt || row.updated_at || '';

          if (!existing || rowUpdated >= (existing.updatedAt || '')) {
            ordersMap.set(key, {
              ...parsed,
              id: row.id,
              userId: uId,
              createdAt: parsed.createdAt || row.created_at,
              updatedAt: rowUpdated,
            });
          }
        } catch {}
      }
    }

    const allOrders = Array.from(ordersMap.values());
    if (productId) {
      return allOrders.filter((o) => o.productId === productId);
    }

    return allOrders;
  } catch {
    return [];
  }
}

/**
 * Atualiza o status de pagamento e valor pago de um pedido específico (pelo Admin)
 */
export async function updateShirtOrderStatus(
  supabase: SupabaseClient,
  order: ShirtOrder,
  paymentStatus: ShirtOrder['paymentStatus'],
  amountPaid: number,
  adminNotes?: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const updatedOrder: ShirtOrder = {
      ...order,
      paymentStatus,
      amountPaid,
      notes: adminNotes !== undefined ? adminNotes : order.notes,
      updatedAt: now,
    };

    const prodKey = order.productId ? `${order.productId}_` : '';
    const titleKey = `${SHIRT_ORDER_PREFIX}${prodKey}${order.userId}`;
    const payload = JSON.stringify(updatedOrder);

    const { data: existing } = await supabase
      .from('donation_guides')
      .select('id')
      .eq('title', titleKey)
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
        .insert([{ title: titleKey, content: payload }]);
      return !error;
    }
  } catch {
    return false;
  }
}
