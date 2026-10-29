// Analytics event names. Invite events measure the shared-notebook fake door.
export const EVENTS = {
  inviteSeen: 'invite_door_seen',
  inviteTapped: 'invite_door_tapped',
  inviteNotify: 'invite_door_notify',
  notebookCreated: 'notebook_created',
  onboardingStep: 'onboarding_step',
  onboardingDone: 'onboarding_done',
  notificationPermission: 'notification_permission',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/** Where an invite door was shown. */
export const INVITE_SOURCES = { notebookPage: 'notebook_page', newNotebook: 'new_notebook' } as const;
