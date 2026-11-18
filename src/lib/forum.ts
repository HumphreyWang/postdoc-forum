// Tentative deadlines: inclusive, 23:59:59 China Standard Time (UTC+8).
export const forum = {
  registrationUrl: 'https://docs.qq.com/form/page/DUXF5YnRydUZmS0ZI',
  year: 2026, registrationDeadline: '2026-12-07', abstractDeadline: '2026-12-01',
  // Meeting dates/venues follow Announcement/AstroConnect_2026.pptx.
  meetingStart: '2026-12-14', meetingEnd: '2026-12-15',
  approximateTalks: 20, approximatePosters: 25, participantLimit: 50,
  timeZone: 'Asia/Shanghai', abstractMaxWords: 150,
  passportPhotoMaxBytes: 5 * 1024 * 1024
} as const;
export const meetingDateLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: forum.timeZone
}).formatRange(new Date(`${forum.meetingStart}T00:00:00+08:00`), new Date(`${forum.meetingEnd}T00:00:00+08:00`));

export type SubmissionKind = 'registration' | 'abstract';
export const roles = ['postdoc', 'phd', 'faculty', 'other'] as const;
export const topics = ['galaxies', 'stars', 'planets', 'cosmology', 'compact', 'methods', 'other'] as const;
export const formats = ['oral', 'poster', 'attend'] as const;
export const documentTypes = ['id_card', 'passport'] as const;
export const discussionTopics = ['ai', 'career_development', 'work_life_balance', 'collaboration', 'funding', 'publishing'] as const;
export function requiresAbstract(preference: string) {
  return preference === 'oral' || preference === 'poster';
}
export function deadlinePassed(kind: SubmissionKind, now = Date.now()) {
  const date = kind === 'registration' ? forum.registrationDeadline : forum.abstractDeadline;
  return now > Date.parse(`${date}T23:59:59.999+08:00`);
}
