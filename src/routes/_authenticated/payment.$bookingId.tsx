import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { EXTRAS, carTitle, formatKzt } from "@/lib/cars";
import { completePurchase } from "@/lib/dealership.functions";

export const Route = createFileRoute("/_authenticated/payment/$bookingId")({
  head: () => ({
    meta: [
      { title: "Оплата автомобиля — «Ласточка»" },
      {
        name: "description",
        content: "Итоговый расчёт, дополнительные услуги и оплата автомобиля в автоцентре «Ласточка».",
      },
      { property: "og:title", content: "Оплата автомобиля — «Ласточка»" },
      { property: "og:description", content: "Оплатите автомобиль картой или переводом." },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pay = useServerFn(completePurchase);

  const [selected, setSelected] = useState<string[]>(["registration"]);
  const [method, setMethod] = useState<"card" | "transfer">("card");
  const [busy, setBusy] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, deposit_kzt, cars(brand, model, trim, price_kzt)")
        .eq("id", bookingId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  if (isLoading) {
    return <main className="mx-auto max-w-4xl px-6 py-12 text-sm text-muted-foreground">Загружаем…</main>;
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Бронь не найдена</h1>
        <Link to="/cabinet" className="mt-4 inline-flex text-sm text-primary">
          В личный кабинет
        </Link>
      </main>
    );
  }

  const base = booking.cars?.price_kzt ?? 0;
  const extrasTotal = EXTRAS.filter((extra) => selected.includes(extra.id)).reduce(
    (sum, extra) => sum + extra.price,
    0,
  );
  const discount = Math.round(base * 0.02);
  const total = base + extrasTotal - discount;
  const paid = booking.status === "completed";

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  async function submit() {
    setBusy(true);
    try {
      const payment = await pay({ data: { bookingId, extras: selected, method } });
      await queryClient.invalidateQueries();
      toast.success(`Оплата прошла. Заказ ${payment.order_no}`);
      void navigate({ to: "/cabinet" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Оплата не прошла");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl bg-surface p-6 backdrop-blur-xl ring-1 ring-hairline">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold">
            Оплата — {booking.cars ? carTitle(booking.cars) : "автомобиль"}
          </div>
          <div className="font-mono text-xs text-muted-foreground">Бронь №{bookingId.slice(0, 8)}</div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span>Автомобиль</span>
              <span className="font-mono">{formatKzt(base)}</span>
            </div>
            {EXTRAS.map((extra) => (
              <label
                key={extra.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 ring-1 ring-hairline"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(extra.id)}
                    onChange={() => toggle(extra.id)}
                    disabled={paid}
                    className="size-4 accent-primary"
                  />
                  {extra.label}
                </span>
                <span className="font-mono text-xs">{formatKzt(extra.price)}</span>
              </label>
            ))}
            <div className="flex justify-between text-ok">
              <span>Скидка клиенту «Ласточки» (2%)</span>
              <span className="font-mono">− {formatKzt(discount)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Внесённая предоплата по брони</span>
              <span className="font-mono">{formatKzt(booking.deposit_kzt)}</span>
            </div>
          </div>

          <div className="flex flex-col rounded-xl bg-surface p-4 ring-1 ring-hairline">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Итого</span>
              <span className="text-xl font-semibold">{formatKzt(total)}</span>
            </div>
            <div className="mt-3 mb-1.5 text-xs text-muted-foreground">Способ оплаты</div>
            <div className="mb-4 flex gap-2">
              {(["card", "transfer"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setMethod(option)}
                  disabled={paid}
                  className={
                    method === option
                      ? "flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground"
                      : "flex-1 rounded-lg bg-surface py-2 text-sm text-muted-foreground ring-1 ring-hairline"
                  }
                >
                  {option === "card" ? "Карта" : "Перевод"}
                </button>
              ))}
            </div>
            <button
              onClick={() => void submit()}
              disabled={busy || paid}
              className="rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {paid ? "Уже оплачено" : `Оплатить ${formatKzt(total)}`}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              Учебная версия: реальные банковские операции не выполняются, платёж фиксируется в системе.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
