import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXTRA_PRICES: Record<string, { label: string; price: number }> = {
  registration: { label: "Госрегистрация", price: 85000 },
  kasko: { label: "Каско на 1 год", price: 1250000 },
  tinting: { label: "Тонировка стёкол", price: 180000 },
  equipment: { label: "Зимний комплект колёс", price: 420000 },
};

const DEPOSIT = 500000;

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ carId: z.string().uuid(), comment: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: car, error: carError } = await supabase
      .from("cars")
      .select("id, status")
      .eq("id", data.carId)
      .maybeSingle();
    if (carError) throw new Error(carError.message);
    if (!car) throw new Error("Автомобиль не найден");
    if (car.status !== "available") throw new Error("Этот автомобиль уже недоступен для брони");

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        car_id: data.carId,
        deposit_kzt: DEPOSIT,
        status: "confirmed",
        comment: data.comment ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("cars").update({ status: "booked" }).eq("id", data.carId);

    return { bookingId: booking.id };
  });

export const createTestDrive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        carId: z.string().uuid(),
        scheduledAt: z.string().min(1),
        comment: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const start = new Date(data.scheduledAt);
    if (Number.isNaN(start.getTime())) throw new Error("Некорректная дата");
    if (start.getTime() < Date.now()) throw new Error("Выберите дату в будущем");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const windowStart = new Date(start.getTime() - 59 * 60 * 1000).toISOString();
    const windowEnd = new Date(start.getTime() + 59 * 60 * 1000).toISOString();

    const { data: clash, error: clashError } = await supabaseAdmin
      .from("test_drives")
      .select("id")
      .eq("car_id", data.carId)
      .in("status", ["planned", "confirmed"])
      .gte("scheduled_at", windowStart)
      .lte("scheduled_at", windowEnd)
      .limit(1);
    if (clashError) throw new Error(clashError.message);
    if (clash && clash.length > 0) {
      throw new Error("Это время уже занято, выберите другой слот");
    }

    const { data: drive, error } = await supabase
      .from("test_drives")
      .insert({
        user_id: userId,
        car_id: data.carId,
        scheduled_at: start.toISOString(),
        status: "planned",
        comment: data.comment ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { testDriveId: drive.id };
  });

export const completePurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        bookingId: z.string().uuid(),
        extras: z.array(z.string()).max(8),
        method: z.enum(["card", "transfer"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, car_id, status, cars(price_kzt)")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (bookingError) throw new Error(bookingError.message);
    if (!booking) throw new Error("Бронь не найдена");
    if (booking.status === "completed") throw new Error("Эта бронь уже оплачена");

    const base = booking.cars?.price_kzt ?? 0;
    const extrasList = data.extras
      .filter((id) => id in EXTRA_PRICES)
      .map((id) => ({ id, ...EXTRA_PRICES[id]! }));
    const extrasTotal = extrasList.reduce((sum, extra) => sum + extra.price, 0);
    const discount = Math.round(base * 0.02);
    const total = base + extrasTotal - discount;

    const orderNo = `ЛСТ-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        car_id: booking.car_id,
        booking_id: booking.id,
        order_no: orderNo,
        amount_kzt: total,
        discount_kzt: discount,
        extras: extrasList,
        method: data.method,
        status: "paid",
      })
      .select("id, order_no, amount_kzt")
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("bookings").update({ status: "completed" }).eq("id", booking.id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("cars").update({ status: "sold" }).eq("id", booking.car_id);

    return payment;
  });

function supportReplyFor(message: string) {
  const text = message.toLowerCase();
  if (text.includes("тест") || text.includes("драйв")) {
    return "Записать на тест-драйв можно из карточки автомобиля — кнопка «Тест-драйв». Свободные слоты: будни 10:00–19:00, суббота 10:00–16:00.";
  }
  if (text.includes("брон")) {
    return "Бронь действует 3 дня, предоплата 500 000 ₸ и входит в стоимость покупки. Все ваши брони видны в личном кабинете.";
  }
  if (text.includes("оплат") || text.includes("плат") || text.includes("карт")) {
    return "Оплатить можно картой или переводом на странице оплаты из личного кабинета. Постоянным клиентам мы даём скидку 2% от стоимости авто.";
  }
  if (text.includes("кредит") || text.includes("рассроч")) {
    return "Работаем с автокредитом и рассрочкой от банков-партнёров. Первоначальный взнос от 20%, срок до 7 лет — менеджер подготовит расчёт.";
  }
  if (text.includes("адрес") || text.includes("где") || text.includes("салон")) {
    return "Наш салон: Астана, пр. Мангилик Ел 55. Работаем ежедневно с 09:00 до 20:00.";
  }
  if (text.includes("обмен") || text.includes("trade")) {
    return "Да, принимаем автомобиль в трейд-ин. Оценка занимает около 40 минут, результат действует 5 дней.";
  }
  return "Спасибо за обращение! Менеджер «Ласточки» уже смотрит ваш вопрос и ответит в течение пары минут. Пока можете посмотреть каталог и записаться на тест-драйв.";
}

export const sendSupportMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ body: z.string().min(1).max(1000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("support_messages")
      .insert({ user_id: userId, author: "client", body: data.body });
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("support_messages")
      .insert({ user_id: userId, author: "support", body: supportReplyFor(data.body) });

    return { ok: true };
  });
