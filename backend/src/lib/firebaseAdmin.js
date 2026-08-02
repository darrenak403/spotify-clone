import admin from 'firebase-admin'

if (!admin.apps.length) {
  const {FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY} = process.env
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')

    if (!privateKey.includes('BEGIN PRIVATE KEY')) {
      console.warn(
        'FIREBASE_PRIVATE_KEY does not look like a valid PEM key after newline normalization — check env var formatting.'
      )
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
  } else {
    console.warn(
      'Firebase Admin SDK not initialized: missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY env vars. Firebase-auth routes will fail until these are set.'
    )
  }
}

export default admin
