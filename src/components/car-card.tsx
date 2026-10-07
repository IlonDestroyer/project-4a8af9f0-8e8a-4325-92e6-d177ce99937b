import { Link } from "@tanstack/react-router";

import { carImage, carTitle, formatKzt, formatNumber, statusLabels, type Car } from "@/lib/cars";

const statusStyles: Record<Car["status"], string> = {
  available: "bg-ok/15 text-ok",
  booked: "bg-booked/15 text-booked",
  sold: "bg-sold/15 text-sold",
};

export function CarCard({ car }: { car: Car }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-surface backdrop-blur-xl ring-1 ring-hairline transition hover:-translate-y-1 hover:bg-surface-2">
      <Link to="/cars/$slug" params={{ slug: car.slug }} className="block">
        <img
          src={carImage(car.slug, car.image_url)}
          alt={carTitle(car)}
          loading="lazy"
          width={1024}
          height={640}
          className="aspect-[16/10] w-full object-cover"
        />
      </Link>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${statusStyles[car.status]}`}>
            {statusLabels[car.status]}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{car.year}</span>
        </div>
        <h3 className="font-semibold">{carTitle(car)}</h3>
        <div className="mt-1 font-mono text-xs text-muted-foreground">
          {formatNumber(car.mileage_km)} км · {car.fuel} · {car.horsepower} л.с.
        </div>
        <div className="mt-3 text-lg font-semibold">{formatKzt(car.price_kzt)}</div>
        <div className="mt-3 flex gap-2">
          <Link
            to="/cars/$slug"
            params={{ slug: car.slug }}
            className="flex-1 rounded-lg bg-primary py-2 text-center text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            {car.status === "available" ? "Забронировать" : "Подробнее"}
          </Link>
          <Link
            to="/cars/$slug"
            params={{ slug: car.slug }}
            className="flex-1 rounded-lg bg-surface py-2 text-center text-sm ring-1 ring-hairline transition-colors hover:bg-surface-2"
          >
            Тест-драйв
          </Link>
        </div>
      </div>
    </article>
  );
}
