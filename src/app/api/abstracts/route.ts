// Retired: one registration request now includes the optional abstract.
export async function POST() {
  return Response.json({error: 'use_registration', registrationUrl: '/en/registration'}, {
    status: 410, headers: {'Cache-Control': 'no-store'}
  });
}
