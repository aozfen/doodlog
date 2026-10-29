import type { DrawingKey } from '@/mock/images';
import type { NotebookKind } from '@/types';

export type InviteCopy = {
  /** Invite chip on the notebook page. */
  button: string;
  /** Under the "Birlikte doldur" switch in the "Yeni defter" sheet. */
  hint: string;
  /** Invite sheet text. */
  body: string;
};

export type KindInfo = {
  /** Option label in the "Yeni defter" sheet. */
  label: string;
  /** Prefilled notebook name. Empty when only the user knows it (a pet's name). */
  defaultName: string;
  namePlaceholder: string;
  /** Sample drawing on the kind option. undefined = dashed "+" option. */
  art?: DrawingKey;
  /** Shared notebook fake door. null = no one to invite (a pet, yourself). */
  invite: InviteCopy | null;
};

const PARTNER_INVITE: InviteCopy = {
  button: 'Partnerini davet et',
  hint: 'Sevgilini davet et, o da eklesin',
  body: 'Sevgilin de anı ekleyebilecek, ikiniz de her şeyi göreceksiniz. Hazır olunca ilk sana haber verelim mi?',
};

const GENERIC_INVITE: InviteCopy = {
  button: 'Birlikte doldur',
  hint: 'Bir kişiyi davet et, o da eklesin',
  body: 'Davet ettiğin kişi de anı ekleyebilecek, ikiniz de her şeyi göreceksiniz. Hazır olunca ilk sana haber verelim mi?',
};

const NAME_PLACEHOLDER = 'Mesela: Tatillerimiz';

export const NOTEBOOK_KINDS: Record<NotebookKind, KindInfo> = {
  partner: {
    label: 'Sevgilim',
    defaultName: 'Sevgilimle',
    namePlaceholder: NAME_PLACEHOLDER,
    art: 'couple02',
    invite: PARTNER_INVITE,
  },
  child: {
    label: 'Çocuğum',
    defaultName: 'Çocuğum',
    namePlaceholder: 'Mesela: Bebeğimiz',
    art: 'couple08',
    invite: GENERIC_INVITE,
  },
  pet: {
    label: 'Evcil hayvan',
    defaultName: '',
    namePlaceholder: 'Adı ne? Mesela: Fıstık',
    art: 'dog01',
    invite: null,
  },
  family: {
    label: 'Ailem',
    defaultName: 'Ailem',
    namePlaceholder: NAME_PLACEHOLDER,
    art: 'couple06',
    invite: GENERIC_INVITE,
  },
  friends: {
    label: 'Arkadaşlar',
    defaultName: 'Arkadaşlarla',
    namePlaceholder: NAME_PLACEHOLDER,
    art: 'self05',
    invite: GENERIC_INVITE,
  },
  self: {
    label: 'Kendim',
    defaultName: 'Kendim',
    namePlaceholder: NAME_PLACEHOLDER,
    art: 'self01',
    invite: null,
  },
  other: {
    label: 'Başka',
    defaultName: '',
    namePlaceholder: NAME_PLACEHOLDER,
    invite: GENERIC_INVITE,
  },
};

/** Options in the "Yeni defter" sheet, in grid order. "Kendim" comes from onboarding only. */
export const NEW_NOTEBOOK_KINDS: NotebookKind[] = ['partner', 'child', 'pet', 'family', 'friends', 'other'];
