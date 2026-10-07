import bmwX5 from "@/assets/car-bmw-x5.jpg";
import audiQ7 from "@/assets/car-audi-q7.jpg";
import mercedesE200 from "@/assets/car-mercedes-e200.jpg";
import toyotaCamry from "@/assets/car-toyota-camry.jpg";
import kiaK5 from "@/assets/car-kia-k5.jpg";
import hyundaiTucson from "@/assets/car-hyundai-tucson.jpg";
import type { Database } from "@/integrations/supabase/types";

export type Car = Database["public"]["Tables"]["cars"]["Row"];
export type CarStatus = Car["status"];

const images: Record<string, string> = {
  "bmw-x5-xdrive40i": bmwX5,
  "audi-q7-45-tfsi": audiQ7,
  "mercedes-e200-amg-line": mercedesE200,
  "toyota-camry-prestige": toyotaCamry,
  "kia-k5-gt-line": kiaK5,
  "hyundai-tucson-prestige": hyundaiTucson,
};

export function carImage(slug: string, imageUrl?: string | null) {
  return imageUrl || images[slug] || bmwX5;
}

export function carTitle(car: Pick<Car, "brand" | "model" | "trim">) {
  return [car.brand, car.model, car.trim].filter(Boolean).join(" ");
}

const tenge = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatKzt(value: number) {
  return `${tenge.format(value)} ₸`;
}

export function formatNumber(value: number) {
  return tenge.format(value);
}

export const statusLabels: Record<CarStatus, string> = {
  available: "В наличии",
  booked: "Забронирован",
  sold: "Продан",
};

export const bookingStatusLabels: Record<string, string> = {
  created: "Создана",
  confirmed: "Подтверждена",
  completed: "Завершена",
  cancelled: "Отменена",
  expired: "Просрочена",
};

export const testDriveStatusLabels: Record<string, string> = {
  planned: "Запланирован",
  confirmed: "Подтверждён",
  done: "Проведён",
  cancelled: "Отменён",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "В обработке",
  paid: "Оплачен",
  failed: "Не прошёл",
};

export const EXTRAS = [
  { id: "registration", label: "Госрегистрация", price: 85000 },
  { id: "kasko", label: "Каско на 1 год", price: 1250000 },
  { id: "tinting", label: "Тонировка стёкол", price: 180000 },
  { id: "equipment", label: "Зимний комплект колёс", price: 420000 },
] as const;

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
