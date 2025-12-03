/**
 * Test script to manually run daily game preparation
 * Run with: npx tsx --env-file=.env.local scripts/test-daily-prep.ts
 */

import 'dotenv/config'
import { prepareTomorrowGames } from '../lib/db/daily-prep'

prepareTomorrowGames()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })

