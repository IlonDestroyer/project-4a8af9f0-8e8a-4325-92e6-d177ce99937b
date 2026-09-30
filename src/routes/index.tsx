import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import heroImage from "@/assets/hero-showroom.jpg";
import { CarCard } from "@/components/car-card";
import { supabase } from "@/integrations/supabase/client";
import { carTitle, type Car } from "@/lib/cars";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Каталог автомобилей — автоцентр «Ласточка»" },
      {
        name: "description",
        content:
          "Автомобили в наличии в автоцентре «Ласточка»: фильтры по марке, цене и году, онлайн-бронирование и запись на тест-драйв.",
      },
      { property: "og:title", content: "Каталог автомобилей — автоцентр «Ласточка»" },
      {
        property: "og:description",
        content: "Подберите автомобиль, забронируйте его или запишитесь на тест-драйв за минуту.",
      },
    ],
  }),
  component: CatalogPage,
});

const BODIES = ["Все", "Седан", "Кроссовер"] as const;

function CatalogPage() {
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("Все марки");
  const [body, setBody] = useState<string>("Все");
  const [year, setYear] = useState("Любой");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data as Car[];
    },
  });

  const brands = useMemo(
    () => ["Все марки", ...Array.from(new Set(cars.map((car) => car.brand)))],
    [cars],
  );
  const years = useMemo(
    () => ["Любой", ...Array.from(new Set(cars.map((car) => String(car.year)))).sort().reverse()],
    [cars],
  );

  const filtered = cars.filter((car) => {
    const haystack = `${carTitle(car)} ${car.year} ${car.body}`.toLowerCase();
    if (search && !haystack.includes(search.toLowerCase())) return false;
    if (brand !== "Все марки" && car.brand !== brand) return false;
    if (body !== "Все" && car.body !== body) return false;
    if (year !== "Любой" && String(car.year) !== year) return false;
    if (priceFrom && car.price_kzt < Number(priceFrom) * 1_000_000) return false;
    if (priceTo && car.price_kzt > Number(priceTo) * 1_000_000) return false;
    return true;
  });

  const available = cars.filter((car) => car.status === "available").length;

  function reset() {
    setSearch("");
    setBrand("Все марки");
    setBody("Все");
    setYear("Любой");
    setPriceFrom("");
    setPriceTo("");
  }

  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-start gap-8 px-6 py-12 lg:grid-cols-[1fr_320px]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {available} авто в наличии
          </span>
          <h1 className="mt-4 max-w-[22ch] text-5xl font-semibold leading-tight sm:text-6xl">
            Каталог премиальных авто
          </h1>
          <p className="mt-5 max-w-[46ch] text-base text-muted-foreground">
            Найдите машину за минуту. Бронирование, тест-драйв и оплата — в одном окне.
          </p>
          <div className="mt-7 flex max-w-xl items-center gap-3 rounded-2xl bg-surface-2 p-2 pl-4 backdrop-blur-xl ring-1 ring-hairline">
            <span className="shrink-0 font-mono text-sm text-muted-foreground">Поиск</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="BMW X5, 2023, седан"
            />
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl bg-surface backdrop-blur-xl ring-1 ring-hairline">
            <img
              src={heroImage}
              alt="Автомобиль в шоуруме «Ласточка»"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-6 px-6 pb-16 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-5 rounded-2xl bg-surface p-4 backdrop-blur-xl ring-1 ring-hairline lg:sticky lg:top-20">
          <div className="text-sm font-semibold">Фильтры</div>
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">Марка</div>
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline"
            >
              {brands.map((item) => (
                <option key={item} value={item} className="bg-card">
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">Цена, млн ₸</div>
            <div className="flex gap-2">
              <input
                value={priceFrom}
                onChange={(event) => setPriceFrom(event.target.value)}
                placeholder="от 8"
                inputMode="numeric"
                className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
              />
              <input
                value={priceTo}
                onChange={(event) => setPriceTo(event.target.value)}
                placeholder="до 60"
                inputMode="numeric"
                className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">Год выпуска</div>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="w-full rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline"
            >
              {years.map((item) => (
                <option key={item} value={item} className="bg-card">
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted-foreground">Кузов</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {BODIES.map((item) => (
                <button
                  key={item}
                  onClick={() => setBody(item)}
                  className={
                    body === item
                      ? "rounded-lg bg-primary px-2.5 py-1.5 font-medium text-primary-foreground"
                      : "rounded-lg bg-surface px-2.5 py-1.5 text-muted-foreground hover:text-foreground"
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={reset}
            className="w-full rounded-lg bg-surface-2 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Сбросить
          </button>
        </aside>

        <div className="grid gap-4 sm:grid-cols-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загружаем каталог…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">По этим условиям автомобилей нет.</p>
          ) : (
            filtered.map((car) => <CarCard key={car.id} car={car} />)
          )}
        </div>
      </section>
    </main>
  );
}
