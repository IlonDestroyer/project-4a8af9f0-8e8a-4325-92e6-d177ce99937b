import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Search = { mode?: "signin" | "signup" };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    mode: search['mode'] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "Вход в личный кабинет — «Ласточка»" },
      {
        name: "description",
        content:
          "Вход и регистрация в личном кабинете автоцентра «Ласточка»: брони, тест-драйвы и платежи.",
      },
      { property: "og:title", content: "Вход в личный кабинет — «Ласточка»" },
      { property: "og:description", content: "Войдите, чтобы бронировать авто и записываться на тест-драйв." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState(false);

  useEffect(() => {
    if (session) void navigate({ to: "/cabinet", replace: true });
  }, [session, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setSentConfirmation(true);
          toast.success("Мы отправили письмо — подтвердите адрес, чтобы войти");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Добро пожаловать!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось выполнить вход");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Не удалось войти через Google");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/cabinet", replace: true });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-6 py-16">
      <div className="rounded-2xl bg-surface p-6 backdrop-blur-xl ring-1 ring-hairline">
        <h1 className="text-2xl font-semibold">{isSignUp ? "Регистрация" : "Вход в кабинет"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Личный кабинет «Ласточки»: брони, тест-драйвы, платежи и переписка с менеджером.
        </p>

        {sentConfirmation ? (
          <div className="mt-5 rounded-xl bg-surface-2 p-4 text-sm">
            Письмо с подтверждением отправлено на {email}. Откройте ссылку из письма, затем вернитесь
            и войдите.
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-5 space-y-3">
          {isSignUp ? (
            <>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Имя и фамилия"
                required
                className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Телефон, +7 700 000 00 00"
                className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
              />
            </>
          ) : null}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Электронная почта"
            required
            className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Пароль"
            required
            minLength={6}
            className="w-full rounded-lg bg-surface px-3 py-2.5 text-sm outline-none ring-1 ring-hairline placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {isSignUp ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          или
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={() => void googleSignIn()}
          className="w-full rounded-lg bg-surface-2 py-2.5 text-sm font-medium ring-1 ring-hairline transition-colors hover:bg-accent"
        >
          Войти через Google
        </button>

        <button
          onClick={() => setIsSignUp((value) => !value)}
          className="mt-4 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {isSignUp ? "У меня уже есть аккаунт" : "Создать новый аккаунт"}
        </button>
      </div>
    </main>
  );
}
