import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { sendSupportMessage } from "@/lib/dealership.functions";

export function SupportPanel({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const send = useServerFn(sendSupportMessage);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["support-messages", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, author, body, created_at")
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("support-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["support-messages", user.id] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function submit() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await send({ data: { body } });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["support-messages", user?.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  }

  if (!user) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Чтобы написать в поддержку «Ласточки», войдите в личный кабинет — переписка сохраняется в вашем аккаунте.</p>
        <Link
          to="/auth"
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`space-y-2 overflow-y-auto pr-1 ${compact ? "max-h-72" : "max-h-[420px] min-h-56"}`}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Здравствуйте! Спросите про бронь, тест-драйв, оплату или кредит — ответим сразу.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.author === "client"
                  ? "ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[85%] rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2 text-sm"
              }
            >
              {message.body}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
          placeholder="Ваш вопрос менеджеру…"
          className="flex-1 rounded-lg bg-surface px-3 py-2 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
        />
        <button
          onClick={() => void submit()}
          disabled={sending}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

export function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(22rem,calc(100vw-3rem))]">
      {open ? (
        <div className="rounded-2xl bg-card p-4 ring-1 ring-hairline shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-ok" />
            <span className="text-sm font-medium">Поддержка «Ласточки»</span>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto text-sm text-muted-foreground hover:text-foreground"
            >
              Свернуть
            </button>
          </div>
          <SupportPanel compact />
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="ml-auto flex items-center gap-3 rounded-2xl bg-surface-2 py-2.5 pl-2 pr-4 ring-1 ring-hairline backdrop-blur-xl shadow-lg"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            Л
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-medium">Поддержка «Ласточки»</span>
            <span className="block text-xs text-ok">Онлайн · ответ ~2 мин</span>
          </span>
        </button>
      )}
    </div>
  );
}
