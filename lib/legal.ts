// Mentions légales (LCEN, art. 6-III) : l'hébergeur dépend du déploiement, il est donc
// lu dans l'environnement au build. Sans variable, repli sur Vercel, l'hébergeur actuel.
const VERCEL = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723, USA",
  contact: "https://vercel.com",
};

export function getHost() {
  return {
    name: process.env.LEGAL_HOST_NAME || VERCEL.name,
    address: process.env.LEGAL_HOST_ADDRESS || VERCEL.address,
    /** Site web ou téléphone de l'hébergeur. */
    contact: process.env.LEGAL_HOST_CONTACT || VERCEL.contact,
  };
}

/** SIRET de l'éditeur, affiché seulement s'il est renseigné (activité professionnelle déclarée). */
export function getSiret() {
  return process.env.LEGAL_SIRET || null;
}
