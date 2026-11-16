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
 * Só aparece se estiver em 'pre_save' (e dentro do prazo, caso haja data limite) ou 'oficial'.
 * Se estiver 'inativo' ou 'encomendado', NÃO aparece para os membros.
 */
export function isProductVisibleToMembers(product: OfficialProduct): boolean {
  if (product.phase === 'inativo' || product.phase === 'encomendado') {
    return false;
  }
  if (product.phase === 'pre_save' && product.preSaveDeadline) {
    // Verifica se a data limite do pré-save já passou (considerando fim do dia local)
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
 * Busca os pedidos de um usuário (todos ou de um produto específico)
 */
export async function fetchUserProductOrders(
  supabase: SupabaseClient,
  userId: string
): Promise<ShirtOrder[]> {
  try {
    const all = await fetchAllShirtOrders(supabase);
    return all.filter((o) => o.userId === userId);
  } catch {
    return [];
  }
}

/**
 * Salva ou atualiza a solicitação de um produto oficial pelo usuário
 */
export async function saveUserShirtOrder(
  supabase: SupabaseClient,
  orderData: Omit<ShirtOrder, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ShirtOrder | null> {
  try {
    const prodKey = orderData.productId ? `${orderData.productId}_` : '';
    const titleKey = `${SHIRT_ORDER_PREFIX}${prodKey}${orderData.userId}`;
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
 * Cancela a solicitação de um produto específico do usuário
 */
export async function cancelUserShirtOrder(
  supabase: SupabaseClient,
  userId: string,
  productId?: string
): Promise<boolean> {
  try {
    const prodKey = productId ? `${productId}_` : '';
    const titleKey = `${SHIRT_ORDER_PREFIX}${prodKey}${userId}`;
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
 * Limpa os pedidos de um produto específico (usado opcionalmente ao reabilitar um novo lote do zero)
 */
export async function clearProductOrders(
  supabase: SupabaseClient,
  productId: string
): Promise<boolean> {
  try {
    const orders = await fetchAllShirtOrders(supabase, productId);
    const ids = orders.map((o) => o.id).filter(Boolean) as string[];
    if (ids.length === 0) return true;
    const { error } = await supabase
      .from('donation_guides')
      .delete()
      .in('id', ids);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Busca todos os pedidos de produtos oficiais (filtrando opcionalmente por productId)
 */
export async function fetchAllShirtOrders(
  supabase: SupabaseClient,
  productId?: string
): Promise<ShirtOrder[]> {
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
        const suffix = row.title.replace(SHIRT_ORDER_PREFIX, '').trim();
        orders.push({
          ...parsed,
          id: row.id,
          userId: parsed.userId || suffix,
          createdAt: parsed.createdAt || row.created_at,
          updatedAt: parsed.updatedAt || row.updated_at,
        });
      } catch {}
    }

    if (productId) {
      return orders.filter((o) => o.productId === productId);
    }

    return orders;
  } catch {
    return [];
  }
}

/**
 * Atualiza o status de pagamento e valor pago de um pedido específico (pelo Admin)
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
