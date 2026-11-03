-- "Specialists" staff department (e.g. the quality management system specialist).
-- Idempotent; the app applies the same change on first save (src/lib/staffDepartments.ts).
ALTER TABLE "Staff" DROP CONSTRAINT IF EXISTS "Staff_department_check";
ALTER TABLE "Staff"
  ADD CONSTRAINT "Staff_department_check"
  CHECK ("department" IN ('certification', 'laboratory', 'slab', 'management', 'specialists'));
