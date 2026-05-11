import { db } from "@/db";
import { drPlannerChats, drPlannerMessages, users } from "@/db/schema";
import { count, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  AdminMetricCard,
  AdminPageHeader,
  adminPageShell,
} from "../_components/admin-ui";
import { AdminChatsClient } from "./chats-client";

const PER_PAGE = 50;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminChatsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? 1));
  const offset = (page - 1) * PER_PAGE;

  const where = q
    ? or(
        ilike(drPlannerChats.title, `%${q}%`),
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`)
      )
    : undefined;

  const [rows, [{ total }], [stats]] = await Promise.all([
    db
      .select({
        id: drPlannerChats.id,
        title: drPlannerChats.title,
        createdAt: drPlannerChats.createdAt,
        updatedAt: drPlannerChats.updatedAt,
        userName: users.name,
        userEmail: users.email,
        messageCount: sql<number>`count(${drPlannerMessages.id})::int`,
      })
      .from(drPlannerChats)
      .leftJoin(users, eq(drPlannerChats.userId, users.id))
      .leftJoin(
        drPlannerMessages,
        eq(drPlannerMessages.chatId, drPlannerChats.id)
      )
      .where(where)
      .groupBy(
        drPlannerChats.id,
        drPlannerChats.title,
        drPlannerChats.createdAt,
        drPlannerChats.updatedAt,
        users.name,
        users.email
      )
      .orderBy(desc(drPlannerChats.updatedAt))
      .limit(PER_PAGE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(drPlannerChats)
      .leftJoin(users, eq(drPlannerChats.userId, users.id))
      .where(where),
    db
      .select({
        totalChats: sql<number>`count(distinct ${drPlannerChats.id})::int`,
        totalMessages: sql<number>`count(${drPlannerMessages.id})::int`,
        activeUsers: sql<number>`count(distinct ${drPlannerChats.userId})::int`,
      })
      .from(drPlannerChats)
      .leftJoin(
        drPlannerMessages,
        eq(drPlannerMessages.chatId, drPlannerChats.id)
      ),
  ]);

  const totalNum = Number(total ?? 0);

  return (
    <div className={adminPageShell}>
      <AdminPageHeader
        eyebrow="Admin / Dr. Planner"
        title="Chats Dr. Planner"
        description="Historial de conversaciones de todos los usuarios."
      />

      {/* Summary stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Chats totales",
            value: Number(stats?.totalChats ?? 0),
            color: "text-[#6F8500] dark:text-[#D6FF38]",
          },
          {
            label: "Mensajes totales",
            value: Number(stats?.totalMessages ?? 0),
            color: "text-foreground",
          },
          {
            label: "Usuarios activos",
            value: Number(stats?.activeUsers ?? 0),
            color: "text-brand",
          },
        ].map((s) => (
          <AdminMetricCard
            key={s.label}
            label={s.label}
            value={Number(s.value).toLocaleString("es-ES")}
            valueClassName={s.color}
          />
        ))}
      </div>

      <AdminChatsClient
        chats={rows.map((r) => ({
          ...r,
          messageCount: Number(r.messageCount ?? 0),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }))}
        total={totalNum}
        page={page}
        totalPages={Math.ceil(totalNum / PER_PAGE)}
        q={q}
      />
    </div>
  );
}
