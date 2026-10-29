// Evolu schema. Append only: never rename or remove a table or column, never change a column type.
// Evolu adds the system columns itself: createdAt, updatedAt, isDeleted, ownerId.
import * as Evolu from '@evolu/common';

export const NotebookId = Evolu.id('Notebook');

export const MemoryId = Evolu.id('Memory');

export const ProfileId = Evolu.id('Profile');

export const NotebookKind = Evolu.union('partner', 'child', 'family', 'friends', 'pet', 'self', 'other');
export const Goal = Evolu.union('weekly1', 'weekly3', 'daily');
export const JobStatus = Evolu.union('drawing', 'done', 'failed');

/** A picture saved as text: "drawing:<key>" / "photo:<key>" for bundled mock images, else a file URI. */
export const PictureRef = Evolu.NonEmptyTrimmedString1000;

export const Schema = {
  notebook: {
    id: NotebookId,
    name: Evolu.NonEmptyTrimmedString100,
    kind: NotebookKind,
    /** ISO day shown as the start of the notebook. Not the same as the system createdAt. */
    createdOn: Evolu.PlainDateIso,
    cover: Evolu.nullOr(PictureRef),
  },
  memory: {
    id: MemoryId,
    notebookId: NotebookId,
    date: Evolu.PlainDateIso,
    note: Evolu.nullOr(Evolu.NonEmptyTrimmedString1000),
    drawing: PictureRef,
    photo: Evolu.nullOr(PictureRef),
  },
  /** One row per device (see profileId): settings and onboarding state. */
  profile: {
    id: ProfileId,
    name: Evolu.nullOr(Evolu.NonEmptyTrimmedString100),
    goal: Goal,
    reminderAt: Evolu.nullOr(Evolu.NonEmptyTrimmedString100),
    onboarded: Evolu.SqliteBoolean,
    /** 1 when the account is the developer mock account (seedUser), 0 for a real new user. */
    demo: Evolu.SqliteBoolean,
    brushPack: Evolu.NonNegativeInt,
    brushSubscription: Evolu.NonNegativeInt,
    offerEndsAt: Evolu.nullOr(Evolu.NonNegativeInt),
    // The first drawing job, so a drawing in progress survives an app restart. All null without a job.
    jobNotebookId: Evolu.nullOr(NotebookId),
    jobDrawing: Evolu.nullOr(PictureRef),
    jobPhoto: Evolu.nullOr(PictureRef),
    jobStartedAt: Evolu.nullOr(Evolu.NonNegativeInt),
    jobEndsAt: Evolu.nullOr(Evolu.NonNegativeInt),
    jobStatus: Evolu.nullOr(JobStatus),
    jobRequestId: Evolu.nullOr(Evolu.NonEmptyTrimmedString100),
  },
};

export const profileId = Evolu.createIdFromString<'Profile'>('profile');
