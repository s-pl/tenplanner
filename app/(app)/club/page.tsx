import { createClient } from "@/lib/supabase/server";
import { getOwnedClub, getCoachMemberships, listClubRoster } from "@/lib/clubs";
import { redirect } from "next/navigation";
import { ClubOwnerPanel } from "./club-owner-panel";
import { NewClubForm } from "./new-club-form";
import { Users2 } from "lucide-react";

export default async function ClubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [ownedClub, coachOf] = await Promise.all([
    getOwnedClub(user.id),
    getCoachMemberships(user.id),
  ]);

  if (ownedClub) {
    const { members, invites } = await listClubRoster(ownedClub.id);
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div>
          <p className="tp-kicker">Mi club</p>
          <h1 className="mt-2 text-3xl font-black text-foreground">
            {ownedClub.name}
          </h1>
          <p className="mt-2 text-sm leading-6 text-foreground/62">
            Invita monitores por email. Cuando acepten, tendrás acceso
            compartido a sus sesiones, alumnos, grupos y calendario — cada uno
            conserva su propio panel.
          </p>
        </div>
        <ClubOwnerPanel
          club={ownedClub}
          initialMembers={members}
          initialInvites={invites}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="tp-kicker">Mi club</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">
          Monitores y clubs
        </h1>
      </div>

      {coachOf.length > 0 && (
        <div className="rounded-[28px] border border-[#050505]/10 bg-white p-5 dark:border-white/10 dark:bg-[#10100e]">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground/70">
            <Users2 className="size-4" />
            Formas parte de
          </h2>
          <ul className="mt-3 space-y-2">
            {coachOf.map(({ club }) => (
              <li
                key={club.id}
                className="rounded-2xl border border-[#050505]/10 px-4 py-3 text-sm font-semibold text-foreground dark:border-white/10"
              >
                {club.name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-foreground/50">
            Ese club tiene acceso compartido a tus sesiones, alumnos, grupos y
            calendario.
          </p>
        </div>
      )}

      <div className="rounded-[28px] border border-[#050505]/10 bg-white p-5 dark:border-white/10 dark:bg-[#10100e]">
        <h2 className="text-sm font-black uppercase tracking-wide text-foreground/70">
          ¿Diriges un club?
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground/62">
          Regístralo para invitar a tus monitores y gestionar su espacio desde
          una cuenta común. Es solo informativo por ahora, sin facturación.
        </p>
        <div className="mt-4">
          <NewClubForm />
        </div>
      </div>
    </div>
  );
}
