ALTER TABLE uniform_details ALTER COLUMN garment_type TYPE text;
DROP TYPE garment_type;
UPDATE uniform_details SET garment_type = 'remera' WHERE garment_type = 'guardapolvo';
CREATE TYPE garment_type AS ENUM ('remera', 'camisa', 'swetear', 'buzo', 'campera', 'pantalon', 'pollera', 'zapatos');
ALTER TABLE uniform_details ALTER COLUMN garment_type TYPE garment_type USING garment_type::garment_type;
