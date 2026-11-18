import {forum} from '@/lib/forum';

// Older open tabs may still try to send data to the former on-site form.
export function POST() {
  return Response.json(
    {error: 'registration_moved', registrationUrl: forum.registrationUrl},
    {status: 410, headers: {'Cache-Control': 'no-store'}}
  );
}
