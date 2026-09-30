import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  carImage,
  carTitle,
  formatKzt,
  formatNumber,
  statusLabels,
  type Car,
} from "@/lib/cars";
import { createBooking, createTestDrive } from "@/lib/dealership.functions";

export const Route = createFileRoute("/cars/$slug")({
  head: () => ({
    meta: [
      { title: "Автомобиль — автоцентр «Ласточка»" },
      {
        name: "description",
        content:
          "Характеристики автомобиля, бронирование с предоплатой и запись на тест-драйв в автоцентре «Ласточка».",
      },
      { property: "og:title", content: "Автомобиль — автоцентр «Ласточка»" },
      {
        property: "og:description",
        content: "Забронируйте автомобиль или запишитесь на тест-драйв онлайн.",
      },
    ],
  }),
  component: CarPage,
});

const statusStyles: Record<Car["status"], string> = {
  available: "bg-ok/15 text-ok",
  booked: "bg-booked/15 text-booked",
  sold: "bg-sold/15 text-sold",
};

function CarPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const book = useServerFn(createBooking);
  const bookDrive = useServerFn(createTestDrive);

  const [comment, setComment] = useState("");
  const [driveAt, setDriveAt] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: car, isLoading } = useQuery({
    queryKey: ["car", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").eq("slug", slug).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Car | null;
    },
  });

  if (isLoading) {
    return <main className="mx-auto max-w-7xl px-6 py-12 text-sm text-muted-foreground">Загружаем…</main>;
  }

  if (!car) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Автомобиль не найден</h1>
        <Link to="/" className="mt-4 inline-flex text-sm text-primary">
          Вернуться в каталог
        </Link>
      </main>
    );
  }

  async function handleBooking() {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    setBusy(true);
    try {
      const result = await book({ data: { carId: car!.id, comment: comment || undefined } });
      await queryClient.invalidateQueries();
      toast.success("Автомобиль забронирован на 3 дня");
      void navigate({ to: "/payment/$bookingId", params: { bookingId: result.bookingId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось забронировать");
    } finally {
      setBusy(false);
    }
  }

  async function handleTestDrive() {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    if (!driveAt) {
      toast.error("Выберите дату и время тест-драйва");
      return;
    }
    setBusy(true);
    try {
      await bookDrive({
        data: { carId: car!.id, scheduledAt: new Date(driveAt).toISOString() },
      });
      await queryClient.invalidateQueries();
      toast.success("Вы записаны на тест-драйв");
      void navigate({ to: "/cabinet" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось записаться");
    } finally {
      setBusy(false);
    }
  }

  const specs = [
    { label: "Год выпуска", value: String(car.year) },
    { label: "Кузов", value: car.body },
    { label: "Пробег", value: `${formatNumber(car.mileage_km)} км` },
    { label: "Двигатель", value: `${car.fuel}, ${car.horsepower} л.с.` },
    { label: "Коробка", value: car.transmission },
  ];

  return (
    <main className="mx-auto grid max-w-7xl items-start gap-6 px-6 py-12 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-hairline">
          <img
            src={carImage(car.slug)}
            alt={carTitle(car)}
            width={1024}
            height={640}
            className="aspect-[16/10] w-full object-cover"
          />
        </div>
        <div className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[car.status]}`}>
              {statusLabels[car.status]}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{car.year}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">{carTitle(car)}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{car.description}</p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {specs.map((spec) => (
              <div key={spec.label} className="rounded-xl bg-surface px-4 py-3 ring-1 ring-hairline">
                <dt className="text-xs text-muted-foreground">{spec.label}</dt>
                <dd className="mt-1 text-sm font-medium">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-20">
        <div className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Стоимость</div>
          <div className="mt-1 text-2xl font-semibold">{formatKzt(car.price_kzt)}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Бронь на 3 дня, предоплата 500 000 ₸ входит в стоимость покупки.
          </p>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Комментарий менеджеру (необязательно)"
            rows={2}
            className="mt-4 w-full resize-none rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
          />
          <button
            onClick={() => void handleBooking()}
            disabled={busy || car.status !== "available"}
            className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {car.status === "available"
              ? "Забронировать и перейти к оплате"
              : car.status === "booked"
                ? "Уже забронирован"
                : "Продан"}
          </button>
        </div>

        <div className="rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
          <div className="text-sm font-semibold">Запись на тест-драйв</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Будни 10:00–19:00, суббота 10:00–16:00. Один автомобиль — один слот в час.
          </p>
          <input
            type="datetime-local"
            value={driveAt}
            onChange={(event) => setDriveAt(event.target.value)}
            className="mt-3 w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline"
          />
          <button
            onClick={() => void handleTestDrive()}
            disabled={busy || car.status === "sold"}
            className="mt-3 w-full rounded-lg bg-surface-2 py-2.5 text-sm font-medium ring-1 ring-hairline transition-colors hover:bg-accent disabled:opacity-50"
          >
            Записаться на тест-драйв
          </button>
        </div>
      </div>
    </main>
  );
}
