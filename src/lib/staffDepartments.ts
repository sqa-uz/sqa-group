import { prisma } from "@/lib/prisma";

export const STAFF_DEPARTMENTS = ["certification", "laboratory", "slab", "management", "specialists"] as const;

let checkReady: Promise<unknown> | null = null;

/**
 * Makes the database CHECK on Staff.department accept every department above.
 * Same SQL as the staff department migrations; runs once per server
 * process and only rewrites the constraint when it is missing a department.
 */
export function ensureStaffDepartmentCheck() {
  checkReady ??= (async () => {
    const rows = await prisma.$queryRawUnsafe<{ def: string }[]>(
      `SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conname = 'Staff_department_check'`
    );
    const def = rows[0]?.def ?? "";
    if (rows.length && STAFF_DEPARTMENTS.every((d) => def.includes(`'${d}'`))) return;
    const list = STAFF_DEPARTMENTS.map((d) => `'${d}'`).join(", ");
    await prisma.$transaction([
      prisma.$executeRawUnsafe(`ALTER TABLE "Staff" DROP CONSTRAINT IF EXISTS "Staff_department_check"`),
      prisma.$executeRawUnsafe(
        `ALTER TABLE "Staff" ADD CONSTRAINT "Staff_department_check" CHECK ("department" IN (${list}))`
      ),
    ]);
  })().catch((err) => {
    checkReady = null; // retry on the next save
    throw err;
  });
  return checkReady;
}
