import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { carImage, carTitle, formatKzt, statusLabels, type Car, type CarStatus } from "@/lib/cars";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Управление каталогом — «Ласточка»" },
      { name: "description", content: "Добавление автомобилей и управление статусами продажи." },
      { property: "og:title", content: "Управление каталогом — «Ласточка»" },
      { property: "og:description", content: "Панель администратора автоцентра «Ласточка»." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const empty = {
  brand: "",
  model: "",
  trim: "",
  year: "2024",
  body: "Седан",
  mileage_km: "0",
  fuel: "Бензин",
  horsepower: "150",
  transmission: "Автомат",
  price_kzt: "",
  image_url: "",
  description: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-|-$/g, "");
}

const input =
  "w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground";

function AdminPage() {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const { data: cars = [] } = useQuery({
    queryKey: ["admin-cars"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cars").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as Car[];
    },
  });

  const refresh = () => queryClient.invalidateQueries();

  async function addCar(event: FormEvent) {
    event.preventDefault();
    if (!form.brand || !form.model || !form.price_kzt) {
      toast.error("Заполните марку, модель и цену");
      return;
    }
    setBusy(true);
    const slug = `${slugify(`${form.brand}-${form.model}-${form.trim}`)}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("cars").insert({
      slug,
      brand: form.brand,
      model: form.model,
      trim: form.trim || null,
      year: Number(form.year),
      body: form.body,
      mileage_km: Number(form.mileage_km),
      fuel: form.fuel,
      horsepower: Number(form.horsepower),
      transmission: form.transmission,
      price_kzt: Number(form.price_kzt),
      image_url: form.image_url || null,
      description: form.description || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Не удалось добавить автомобиль");
      return;
    }
    toast.success("Автомобиль добавлен в каталог");
    setForm(empty);
    void refresh();
  }

  async function setStatus(car: Car, status: CarStatus) {
    const { error } = await supabase.from("cars").update({ status }).eq("id", car.id);
    if (error) toast.error("Не удалось изменить статус");
    else {
      toast.success(status === "available" ? "Снова в продаже" : "Статус изменён");
      void refresh();
    }
  }

  async function remove(car: Car) {
    if (!confirm(`Удалить ${carTitle(car)} из каталога навсегда?`)) return;
    const { error } = await supabase.from("cars").delete().eq("id", car.id);
    if (error) toast.error("Не удалось удалить");
    else {
      toast.success("Автомобиль удалён");
      void refresh();
    }
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Нет доступа</h1>
        <p className="mt-2 text-sm text-muted-foreground">Эта страница доступна только администратору.</p>
        <Link to="/" className="mt-4 inline-flex text-sm text-primary">
          В каталог
        </Link>
      </main>
    );
  }

  const field = (key: keyof typeof empty, label: string, type = "text") => (
    <label className="space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className={input}
      />
    </label>
  );

  return (
    <main className="mx-auto grid max-w-7xl items-start gap-6 px-6 py-12 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={addCar} className="space-y-3 rounded-2xl bg-surface p-5 ring-1 ring-hairline">
        <h1 className="text-xl font-semibold">Добавить автомобиль</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("brand", "Марка")}
          {field("model", "Модель")}
          {field("trim", "Комплектация")}
          {field("year", "Год", "number")}
          {field("body", "Кузов")}
          {field("mileage_km", "Пробег, км", "number")}
          {field("fuel", "Топливо")}
          {field("horsepower", "Мощность, л.с.", "number")}
          {field("transmission", "Коробка")}
          {field("price_kzt", "Цена, ₸", "number")}
        </div>
        {field("image_url", "Ссылка на фото (необязательно)")}
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">Описание</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={`${input} resize-none`}
          />
        </label>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Добавить в каталог
        </button>
      </form>

      <section className="space-y-3 rounded-2xl bg-surface p-5 ring-1 ring-hairline">
        <h2 className="text-xl font-semibold">Автомобили ({cars.length})</h2>
        {cars.map((car) => (
          <div key={car.id} className="flex items-center gap-4 rounded-xl bg-surface-2 p-3 ring-1 ring-hairline">
            <img
              src={carImage(car.slug, car.image_url)}
              alt={carTitle(car)}
              className="h-14 w-20 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{carTitle(car)}</div>
              <div className="text-xs text-muted-foreground">
                {formatKzt(car.price_kzt)} · {statusLabels[car.status]}
              </div>
            </div>
            <select
              value={car.status}
              onChange={(e) => void setStatus(car, e.target.value as CarStatus)}
              className="rounded-lg bg-surface px-2 py-1.5 text-xs ring-1 ring-hairline"
              aria-label="Статус"
            >
              <option value="available">В продаже</option>
              <option value="booked">Забронирован</option>
              <option value="sold">Снят / продан</option>
            </select>
            <button
              onClick={() => void remove(car)}
              className="rounded-lg px-2 py-1.5 text-xs text-destructive ring-1 ring-hairline hover:bg-accent"
            >
              Удалить
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
