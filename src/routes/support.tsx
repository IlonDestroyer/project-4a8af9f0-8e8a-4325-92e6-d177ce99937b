import { createFileRoute } from "@tanstack/react-router";

import { SupportPanel } from "@/components/support-widget";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Поддержка — автоцентр «Ласточка»" },
      {
        name: "description",
        content:
          "Чат с менеджером автоцентра «Ласточка»: вопросы по броням, тест-драйвам, оплате и кредиту.",
      },
      { property: "og:title", content: "Поддержка — автоцентр «Ласточка»" },
      { property: "og:description", content: "Напишите менеджеру «Ласточки» прямо на сайте." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Поддержка</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Менеджеры на линии ежедневно с 09:00 до 20:00. Переписка сохраняется в вашем кабинете.
      </p>
      <div className="mt-6 rounded-2xl bg-surface p-5 backdrop-blur-xl ring-1 ring-hairline">
        <SupportPanel />
      </div>
    </main>
  );
}
