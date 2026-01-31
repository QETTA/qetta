/**
 * Database Client Export
 *
 * Re-exports Prisma client as `db` for convenience
 */

import { prisma } from './prisma'

export { prisma, prisma as db }
export default { prisma }
