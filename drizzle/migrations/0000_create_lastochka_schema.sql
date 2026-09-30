-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CARS
CREATE TYPE public.car_status AS ENUM ('available', 'booked', 'sold');

CREATE TABLE public.cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  brand text NOT NULL,
  model text NOT NULL,
  trim text,
  year int NOT NULL,
  body text NOT NULL,
  mileage_km int NOT NULL DEFAULT 0,
  fuel text NOT NULL DEFAULT 'Бензин',
  horsepower int NOT NULL DEFAULT 0,
  transmission text NOT NULL DEFAULT 'Автомат',
  price_kzt bigint NOT NULL,
  status public.car_status NOT NULL DEFAULT 'available',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cars TO anon;
GRANT SELECT ON public.cars TO authenticated;
GRANT ALL ON public.cars TO service_role;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cars public read" ON public.cars FOR SELECT TO anon, authenticated USING (true);

-- BOOKINGS
CREATE TYPE public.booking_status AS ENUM ('created', 'confirmed', 'completed', 'cancelled', 'expired');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  deposit_kzt bigint NOT NULL DEFAULT 500000,
  status public.booking_status NOT NULL DEFAULT 'created',
  expires_at timestamptz NOT NULL DEFAULT now() + interval '3 days',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookings select" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own bookings insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own bookings update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- TEST DRIVES
CREATE TYPE public.test_drive_status AS ENUM ('planned', 'confirmed', 'done', 'cancelled');

CREATE TABLE public.test_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status public.test_drive_status NOT NULL DEFAULT 'planned',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.test_drives TO authenticated;
GRANT ALL ON public.test_drives TO service_role;
ALTER TABLE public.test_drives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own drives select" ON public.test_drives FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own drives insert" ON public.test_drives FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own drives update" ON public.test_drives FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- PAYMENTS
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed');

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  order_no text NOT NULL,
  amount_kzt bigint NOT NULL,
  discount_kzt bigint NOT NULL DEFAULT 0,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  method text NOT NULL DEFAULT 'card',
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments select" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own payments insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own payments update" ON public.payments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- SUPPORT CHAT
CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'client',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages select" ON public.support_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own messages insert" ON public.support_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND author = 'client');

ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- DEMO CARS
INSERT INTO public.cars (slug, brand, model, trim, year, body, mileage_km, fuel, horsepower, transmission, price_kzt, status, description) VALUES
('bmw-x5-xdrive40i', 'BMW', 'X5', 'xDrive40i M Sport', 2023, 'Кроссовер', 45000, 'Бензин', 340, 'Автомат', 44900000, 'available', 'Полный привод, панорамная крыша, пакет M Sport, один владелец.'),
('audi-q7-45-tfsi', 'Audi', 'Q7', '45 TFSI quattro', 2022, 'Кроссовер', 61200, 'Бензин', 245, 'Автомат', 38500000, 'booked', 'Семь мест, quattro, матричные фары, сервисная история.'),
('mercedes-e200-amg-line', 'Mercedes-Benz', 'E 200', 'AMG Line', 2021, 'Седан', 38700, 'Бензин', 197, 'Автомат', 29800000, 'available', 'AMG Line, кожаный салон, адаптивная подвеска.'),
('toyota-camry-prestige', 'Toyota', 'Camry', '2.5 Prestige', 2020, 'Седан', 54300, 'Бензин', 181, 'Автомат', 18400000, 'sold', 'Максимальная комплектация Prestige, обслуживание у дилера.'),
('kia-k5-gt-line', 'Kia', 'K5', 'GT-Line 1.6 T-GDI', 2023, 'Седан', 12100, 'Бензин', 180, 'Автомат', 21400000, 'available', 'GT-Line, вентиляция сидений, камеры 360.'),
('hyundai-tucson-prestige', 'Hyundai', 'Tucson', '2.0 Prestige', 2022, 'Кроссовер', 29800, 'Бензин', 150, 'Автомат', 19900000, 'available', 'Полный привод, подогрев руля и сидений.');
