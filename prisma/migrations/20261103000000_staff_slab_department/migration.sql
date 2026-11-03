-- S-LAB testing laboratory gets its own staff department. Idempotent because the app
-- applies the same change on first staff save (src/lib/staffDepartments.ts).
ALTER TABLE "Staff" DROP CONSTRAINT IF EXISTS "Staff_department_check";
ALTER TABLE "Staff"
  ADD CONSTRAINT "Staff_department_check"
  CHECK ("department" IN ('certification', 'laboratory', 'slab', 'management'));
