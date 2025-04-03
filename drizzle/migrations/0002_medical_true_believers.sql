DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'service' AND column_name = 'sort_order') THEN
    ALTER TABLE service ADD COLUMN sort_order integer DEFAULT 999;
  END IF;
END $$;
