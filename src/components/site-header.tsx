import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            Л
          </span>
          <span className="text-lg font-semibold tracking-tight">Ласточка</span>
          <span className="hidden text-xs text-muted-foreground md:inline">автоцентр</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 text-sm lg:flex">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-surface-2 font-medium text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Каталог
          </Link>
          <Link
            to="/cabinet"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-surface-2 font-medium text-foreground" }}
          >
            Личный кабинет
          </Link>
          <Link
            to="/support"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: "rounded-lg px-3 py-2 bg-surface-2 font-medium text-foreground" }}
          >
            Поддержка
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[18ch] truncate text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <Link
                to="/cabinet"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                Кабинет
              </Link>
              <button
                onClick={signOut}
                className="rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="rounded-lg px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Войти
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
