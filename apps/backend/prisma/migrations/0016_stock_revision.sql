ALTER TABLE "Stock" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0
  CHECK (typeof("revision") = 'integer' AND "revision" >= 0);

CREATE TRIGGER "Stock_validate_insert" BEFORE INSERT ON "Stock"
WHEN typeof(NEW."quantity") != 'integer' OR typeof(NEW."onlineQuantity") != 'integer'
  OR NEW."quantity" < 0 OR NEW."onlineQuantity" < 0 OR NEW."onlineQuantity" > NEW."quantity"
BEGIN
  SELECT RAISE(ABORT, 'Invalid stock quantities');
END;

CREATE TRIGGER "Stock_validate_update" BEFORE UPDATE ON "Stock"
WHEN typeof(NEW."quantity") != 'integer' OR typeof(NEW."onlineQuantity") != 'integer'
  OR NEW."quantity" < 0 OR NEW."onlineQuantity" < 0 OR NEW."onlineQuantity" > NEW."quantity"
BEGIN
  SELECT RAISE(ABORT, 'Invalid stock quantities');
END;
