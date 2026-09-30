import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  bookingStatusLabels,
  carTitle,
  formatDate,
  formatDateTime,
  formatKzt,
  paymentStatusLabels,
  testDriveStatusLabels,
} from "@/lib/cars";

export const Route = createFileRoute("/_authenticated/cabinet")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — автоцентр «Ласточка»" },
      {
        name: "description",
        content: "Ваши брони, записи на тест-драйв и платежи в автоцентре «Ласточка».",
      },
      { property: "og:title", content: "Личный кабинет — автоцентр «Ласточка»" },
      { property: "og:description", content: "Брони, тест-драйвы и история платежей." },
    ],
  }),
  component: CabinetPage,
});

function CabinetPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, deposit_kzt, expires_at, created_at, cars(brand, model, trim, slug, price_kzt)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: drives = [] } = useQuery({
    queryKey: ["test-drives", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_drives")
        .select("id, status, scheduled_at, cars(brand, model, trim)")
        .order("scheduled_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payments", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, order_no, amount_kzt, status, method, created_at, cars(brand, model, trim)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-12">
      <div className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
        <h1 className="text-2xl font-semibold">Личный кабинет</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile?.full_name ? `${profile.full_name} · ` : ""}
          {user?.email}
          {profile?.phone ? ` · ${profile.phone}` : ""}
        </p>
      </div>

      <section className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
        <h2 className="text-lg font-semibold">Брони</h2>
        {bookings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Броней пока нет.{" "}
            <Link to="/" className="text-primary">
              Выбрать автомобиль
            </Link>
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-hairline"
              >
                <div className="min-w-[14rem] flex-1">
                  <div className="text-sm font-medium">
                    {booking.cars ? carTitle(booking.cars) : "Автомобиль"}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    предоплата {formatKzt(booking.deposit_kzt)} · действует до {formatDate(booking.expires_at)}
                  </div>
                </div>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">
                  {bookingStatusLabels[booking.status] ?? booking.status}
                </span>
                {booking.status !== "completed" ? (
                  <Link
                    to="/payment/$bookingId"
                    params={{ bookingId: booking.id }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  >
                    Перейти к оплате
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
        <h2 className="text-lg font-semibold">Тест-драйвы</h2>
        {drives.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Записей на тест-драйв пока нет.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-hairline"
              >
                <div className="min-w-[14rem] flex-1 text-sm font-medium">
                  {drive.cars ? carTitle(drive.cars) : "Автомобиль"}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDateTime(drive.scheduled_at)}
                </span>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">
                  {testDriveStatusLabels[drive.status] ?? drive.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
        <h2 className="text-lg font-semibold">Платежи</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Платежей пока нет.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-4 py-3 ring-1 ring-hairline"
              >
                <div className="min-w-[14rem] flex-1">
                  <div className="text-sm font-medium">
                    {payment.cars ? carTitle(payment.cars) : "Автомобиль"}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    заказ {payment.order_no} · {formatDate(payment.created_at)} ·{" "}
                    {payment.method === "card" ? "карта" : "перевод"}
                  </div>
                </div>
                <span className="font-mono text-sm">{formatKzt(payment.amount_kzt)}</span>
                <span className="rounded-md bg-ok/15 px-2 py-0.5 text-xs text-ok">
                  {paymentStatusLabels[payment.status] ?? payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
