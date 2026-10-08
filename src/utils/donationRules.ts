export type Sex = 'M' | 'F' | 'Outro';

export interface DonationProfile {
  name: string;
  birthDate: Date;
  sex: Sex;
  weight: number;
  lastDonationDate?: Date;
  donationsThisYear: number;
}

export type BadgeType = 'Platina' | 'Ouro' | 'Prata' | 'Bronze' | 'Diamante' | 'Pérola' | 'Rubi' | 'Nenhum';

/**
 * Calcula a data da próxima doação.
 * Homens: 60 dias. Mulheres: 90 dias.
 */
export function calculateNextDonationDate(sex: Sex, lastDonationDate?: Date): Date | null {
  if (!lastDonationDate) return new Date();
  const nextDate = new Date(lastDonationDate);
  if (sex === 'M') {
    nextDate.setDate(nextDate.getDate() + 60);
  } else {
    nextDate.setDate(nextDate.getDate() + 90);
  }
  return nextDate;
}

/**
 * Calcula o selo de gamificação do doador baseado na quantidade de doações no ano e no sexo.
 * Homens (max 4): 4=Platina, 3=Ouro, 2=Prata, 1=Bronze
 * Mulheres (max 3): 3=Diamante, 2=Pérola, 1=Rubi
 */
export function calculateBadge(sex: Sex, donationsThisYear: number): BadgeType {
  if (donationsThisYear === 0) return 'Nenhum';

  if (sex === 'M') {
    if (donationsThisYear >= 4) return 'Platina';
    if (donationsThisYear === 3) return 'Ouro';
    if (donationsThisYear === 2) return 'Prata';
    return 'Bronze';
  } else {
    // Mulheres ou Outro
    if (donationsThisYear >= 3) return 'Diamante';
    if (donationsThisYear === 2) return 'Pérola';
    return 'Rubi';
  }
}

/**
 * Retorna as cores correspondentes para cada selo (para estilização)
 */
export function getBadgeColors(badge: BadgeType) {
  switch (badge) {
    case 'Platina': return { bg: 'bg-slate-200', text: 'text-slate-800' };
    case 'Ouro': return { bg: 'bg-amber-400', text: 'text-amber-900' };
    case 'Prata': return { bg: 'bg-zinc-300', text: 'text-zinc-800' };
    case 'Bronze': return { bg: 'bg-orange-300', text: 'text-orange-900' };
    case 'Diamante': return { bg: 'bg-cyan-200', text: 'text-cyan-800' };
    case 'Pérola': return { bg: 'bg-pink-100', text: 'text-pink-800' };
    case 'Rubi': return { bg: 'bg-red-500', text: 'text-white' };
    default: return { bg: 'bg-transparent', text: 'text-transparent' };
  }
}
