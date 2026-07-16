import { redirect } from "next/navigation";

/** Ancien lien Mouvement Stock → Etat Service */
export default function MouvementsRedirectPage() {
  redirect("/dashboard/stock/etat-services");
}
