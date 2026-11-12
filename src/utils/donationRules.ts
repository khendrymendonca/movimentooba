export type Sex = 'M' | 'F' | 'Outro';

export interface DonationProfile {
  name: string;
  birthDate: Date;
  sex: Sex;
  weight: number;
  lastDonationDate?: Date;
  donationsThisYear: number;
}

export interface GroupCampaign {
  id: string;
  title: string;
  campaign_date: string; // YYYY-MM-DD
  campaign_time?: string; // ex: "08:00"
  location: string;
  description?: string;
  max_participants?: number; // Padrão: 20 vagas por mutirão
  confirmed_count?: number;
  confirmed_users?: { id: string; name: string; confirmedAt: string }[];
  user_confirmed?: boolean;
}

export type BadgeType = 'Diamante' | 'Ouro' | 'Prata' | 'Bronze' | 'Pérola' | 'Rubi' | 'Nenhum';

export interface SupportCampaign {
  id: string;
  patient_name: string;
  hospital: string;
  city?: string;
  blood_type_needed: string; // Ex: 'O+', 'O-', 'A+', 'Qualquer Tipo', etc.
  urgency: 'Normal' | 'Urgente' | 'Crítica';
  description?: string;
  contact_info?: string;
  created_at?: string;
  status: 'Ativa' | 'Concluída';
}

export interface AppNotification {
  id: string;
  type: 'sos' | 'mutirao' | 'noticia' | 'sistema' | 'medalha' | 'chamado';
  title: string;
  message: string;
  link?: string;
  created_at: string;
  is_urgent?: boolean;
}

/**
 * Matriz oficial de compatibilidade para doação de sangue total:
 * Mapeia o tipo sanguíneo do DOADOR para quais tipos de RECEPTORES ele pode doar.
 */
export const BLOOD_DONATION_COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

/**
 * Verifica se um doador com determinado tipo sanguíneo pode doar para um receptor necessitado.
 */
export function canDonateBlood(donorType?: string | null, recipientType?: string | null): boolean {
  if (!donorType) return false;
  const cleanDonor = donorType.trim().toUpperCase();
  const cleanRecipient = (recipientType || '').trim().toUpperCase();

  if (!cleanRecipient || cleanRecipient === 'QUALQUER TIPO' || cleanRecipient === 'TODOS' || cleanRecipient === 'QUALQUER') {
    return true;
  }

  const compatibleRecipients = BLOOD_DONATION_COMPATIBILITY[cleanDonor];
  if (!compatibleRecipients) return false;

  return compatibleRecipients.includes(cleanRecipient);
}

/**
 * Retorna o intervalo mínimo obrigatório em dias entre doações conforme o sexo biológico.
 * Regra do projeto: Homens = 60 dias | Mulheres = 120 dias.
 */
export function getDonationIntervalDays(sex?: Sex | string | null): number {
  return sex === 'M' ? 60 : 120;
}

/**
 * Retorna o limite máximo de doações anuais conforme o sexo biológico.
 * Homens: até 4 doações/ano. Mulheres: até 3 doações/ano.
 */
export function getMaxDonationsPerYear(sex?: Sex | string | null): number {
  return sex === 'M' ? 4 : 3;
}

export interface DonationValidationResult {
  allowed: boolean;
  reason?: string;
  nextAllowedDate?: Date;
  donationsInWindow: number;
  maxAllowedInWindow: number;
  windowResetDate?: Date;
}

/**
 * Valida se uma doação pode ser registrada na data proposta, respeitando rigorosamente:
 * 1. Data válida (não no futuro, não repetida no mesmo dia).
 * 2. Intervalo mínimo obrigatório entre doações consecutivas (60 dias p/ homens, 120 dias p/ mulheres).
 * 3. Limite máximo de doações em uma janela deslizante de 12 meses (4 p/ homens, 3 p/ mulheres).
 *    Ex: Se doou em Julho, o ciclo dessa doação só vira em Julho do ano seguinte.
 */
export function validateNewDonation(
  sex: Sex | string | null | undefined,
  existingDonations: { donation_date: string | Date }[] | (string | Date)[],
  proposedDateInput: string | Date
): DonationValidationResult {
  const proposedDate = parseSafeDate(proposedDateInput);
  const maxPerYear = getMaxDonationsPerYear(sex);

  if (!proposedDate) {
    return {
      allowed: false,
      reason: 'Data de doação inválida.',
      donationsInWindow: 0,
      maxAllowedInWindow: maxPerYear,
    };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (proposedDate > today) {
    return {
      allowed: false,
      reason: 'Não é permitido registrar doações com datas futuras.',
      donationsInWindow: 0,
      maxAllowedInWindow: maxPerYear,
    };
  }

  // Normaliza e ordena todas as doações existentes por data crescente
  const parsedDates: Date[] = existingDonations
    .map((item) => {
      const d = typeof item === 'object' && item !== null && 'donation_date' in item ? item.donation_date : item;
      return parseSafeDate(d as string | Date);
    })
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  // Checa se já existe doação no mesmo dia
  const sameDay = parsedDates.some(
    (d) => d.toISOString().split('T')[0] === proposedDate.toISOString().split('T')[0]
  );
  if (sameDay) {
    return {
      allowed: false,
      reason: 'Já existe uma doação registrada nesta data exata.',
      donationsInWindow: 0,
      maxAllowedInWindow: maxPerYear,
    };
  }

  const intervalDays = getDonationIntervalDays(sex);

  // 1. Valida intervalo mínimo com a doação imediatamente anterior à data proposta
  const previousDonation = [...parsedDates].reverse().find((d) => d < proposedDate);
  if (previousDonation) {
    const diffMs = proposedDate.getTime() - previousDonation.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < intervalDays) {
      const nextDate = new Date(previousDonation);
      nextDate.setDate(nextDate.getDate() + intervalDays);
      return {
        allowed: false,
        reason: `Intervalo mínimo obrigatório não atingido. Para o seu perfil (${sex === 'F' ? 'Feminino - 120 dias' : 'Masculino - 60 dias'}), a próxima data permitida após ${previousDonation.toLocaleDateString('pt-BR')} é ${nextDate.toLocaleDateString('pt-BR')} (faltam ${intervalDays - diffDays} dias).`,
        nextAllowedDate: nextDate,
        donationsInWindow: 0,
        maxAllowedInWindow: maxPerYear,
      };
    }
  }

  // 2. Valida intervalo mínimo com a doação imediatamente posterior (caso esteja inserindo retroativo)
  const nextDonation = parsedDates.find((d) => d > proposedDate);
  if (nextDonation) {
    const diffMs = nextDonation.getTime() - proposedDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < intervalDays) {
      return {
        allowed: false,
        reason: `Conflito com doação já registrada em ${nextDonation.toLocaleDateString('pt-BR')}. É necessário manter pelo menos ${intervalDays} dias de intervalo entre elas.`,
        donationsInWindow: 0,
        maxAllowedInWindow: maxPerYear,
      };
    }
  }

  // 3. Valida limite de doações na janela deslizante de 12 meses
  const oneYearAgo = new Date(proposedDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  oneYearAgo.setHours(0, 0, 0, 0);

  const donationsInWindow = parsedDates.filter(
    (d) => d > oneYearAgo && d <= proposedDate
  );

  if (donationsInWindow.length >= maxPerYear) {
    const oldestInWindow = donationsInWindow[0];
    const windowResetDate = new Date(oldestInWindow);
    windowResetDate.setFullYear(windowResetDate.getFullYear() + 1);

    return {
      allowed: false,
      reason: `Limite de ${maxPerYear} doações atingido nos últimos 12 meses! Seu ciclo de 12 meses virará apenas em ${windowResetDate.toLocaleDateString('pt-BR')} (1 ano após sua doação de ${oldestInWindow.toLocaleDateString('pt-BR')}).`,
      nextAllowedDate: windowResetDate,
      donationsInWindow: donationsInWindow.length,
      maxAllowedInWindow: maxPerYear,
      windowResetDate,
    };
  }

  return {
    allowed: true,
    donationsInWindow: donationsInWindow.length,
    maxAllowedInWindow: maxPerYear,
  };
}

/**
 * Faz o parse seguro de uma string YYYY-MM-DD ou Date em UTC meia-noite local sem desvios de fuso horário.
 */
export function parseSafeDate(dateInput?: Date | string | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const cleanStr = dateInput.split('T')[0];
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const parsed = new Date(dateInput);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calcula a data da próxima doação permitida considerando a última doação e o sexo biológico.
 * Homens: +60 dias. Mulheres: +120 dias.
 */
export function calculateNextDonationDate(sex?: Sex | string | null, lastDonationDate?: Date | string | null): Date | null {
  const baseDate = parseSafeDate(lastDonationDate);
  if (!baseDate) return null;

  const intervalDays = getDonationIntervalDays(sex);
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

/**
 * Verifica se o doador estará apto a doar em uma determinada data (hoje ou na data de um mutirão em massa do grupo).
 */
export function checkEligibilityForDate(
  sex?: Sex | string | null,
  lastDonationDate?: Date | string | null,
  targetDateInput: Date | string = new Date()
): {
  isEligible: boolean;
  nextEligibleDate: Date | null;
  daysRemaining: number;
  intervalDays: number;
} {
  const intervalDays = getDonationIntervalDays(sex);
  const targetDate = parseSafeDate(targetDateInput) || new Date();
  targetDate.setHours(0, 0, 0, 0);

  const nextEligibleDate = calculateNextDonationDate(sex, lastDonationDate);
  if (!nextEligibleDate) {
    return {
      isEligible: true,
      nextEligibleDate: null,
      daysRemaining: 0,
      intervalDays,
    };
  }

  nextEligibleDate.setHours(0, 0, 0, 0);
  const diffMs = nextEligibleDate.getTime() - targetDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  return {
    isEligible: daysRemaining <= 0,
    nextEligibleDate,
    daysRemaining,
    intervalDays,
  };
}

/**
 * Calcula as próximas datas sugeridas de doação no ano para o doador planejar seu calendário.
 */
export function calculateUpcomingEligibleDates(
  sex?: Sex | string | null,
  lastDonationDate?: Date | string | null,
  count: number = 3
): Date[] {
  const intervalDays = getDonationIntervalDays(sex);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstEligible = calculateNextDonationDate(sex, lastDonationDate);
  const startDate = firstEligible && firstEligible > today ? firstEligible : today;

  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * intervalDays);
    dates.push(d);
  }
  return dates;
}

/**
 * Calcula o selo de gamificação do doador baseado na quantidade de doações no ano e no sexo.
 * Homens (max 4 por ano): 1=Bronze, 2=Prata, 3=Ouro, 4=Diamante
 * Mulheres (max 3 por ano): 1=Rubi, 2=Pérola, 3=Diamante
 */
export function calculateBadge(sex?: Sex | string | null, donationsCount: number = 0): BadgeType {
  if (!donationsCount || donationsCount <= 0) return 'Nenhum';

  if (sex === 'M') {
    if (donationsCount >= 4) return 'Diamante';
    if (donationsCount === 3) return 'Ouro';
    if (donationsCount === 2) return 'Prata';
    return 'Bronze';
  } else {
    if (donationsCount >= 3) return 'Diamante';
    if (donationsCount === 2) return 'Pérola';
    return 'Rubi';
  }
}

/**
 * Retorna as cores correspondentes para cada selo (para estilização)
 */
export function getBadgeColors(badge: BadgeType) {
  switch (badge) {
    case 'Diamante': return { bg: 'bg-cyan-100 border border-cyan-300', text: 'text-cyan-900' };
    case 'Ouro': return { bg: 'bg-amber-100 border border-amber-300', text: 'text-amber-900' };
    case 'Prata': return { bg: 'bg-zinc-100 border border-zinc-300', text: 'text-zinc-800' };
    case 'Bronze': return { bg: 'bg-orange-100 border border-orange-300', text: 'text-orange-900' };
    case 'Pérola': return { bg: 'bg-pink-100 border border-pink-300', text: 'text-pink-900' };
    case 'Rubi': return { bg: 'bg-rose-100 border border-rose-300', text: 'text-rose-900' };
    default: return { bg: 'bg-transparent', text: 'text-transparent' };
  }
}

/**
 * Sanitiza entradas de texto contra XSS e injeção de caracteres de controle.
 */
export function sanitizeText(value: string, maxLength: number = 500): string {
  if (!value) return '';
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Valida arquivos de upload (MIME type estrito, tamanho máximo e extensão segura)
 * Previne Stored XSS via SVG/HTML e ataques de negação de serviço (DoS).
 */
export function validateSafeUpload(
  file: File,
  options: { maxSizeMB: number; allowedTypes: ('image' | 'document')[] }
): { valid: boolean; error?: string; safeExtension?: string } {
  const maxBytes = options.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `O arquivo excede o tamanho máximo permitido de ${options.maxSizeMB}MB.`,
    };
  }

  const mimeToExt: Record<string, string> = {};
  if (options.allowedTypes.includes('image')) {
    mimeToExt['image/jpeg'] = 'jpg';
    mimeToExt['image/png'] = 'png';
    mimeToExt['image/webp'] = 'webp';
  }
  if (options.allowedTypes.includes('document')) {
    mimeToExt['application/pdf'] = 'pdf';
  }

  const safeExtension = mimeToExt[file.type];
  if (!safeExtension) {
    return {
      valid: false,
      error: options.allowedTypes.includes('document')
        ? 'Formato não permitido. Envie apenas imagens (JPG, PNG, WEBP) ou documentos PDF.'
        : 'Formato de imagem inválido. Utilize apenas JPG, PNG ou WEBP (arquivos SVG não são permitidos por segurança).',
    };
  }

  return { valid: true, safeExtension };
}
