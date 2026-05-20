// src/shared/errorMsg.js
// Traduit les erreurs Supabase brutes en messages conviviaux pour l'utilisateur

const DB_ERROR_MAP = [
    { match: /duplicate key|unique.*constraint|already exists/i,  msg: 'Cette entrée existe déjà.' },
    { match: /foreign key|violates.*constraint/i,                  msg: 'Impossible : des données liées existent encore.' },
    { match: /not.*null|null value/i,                              msg: 'Un champ obligatoire est manquant.' },
    { match: /permission denied|row-level security/i,              msg: 'Vous n\'avez pas la permission d\'effectuer cette action.' },
    { match: /jwt.*expired|invalid.*token/i,                       msg: 'Votre session a expiré. Veuillez vous reconnecter.' },
    { match: /network|failed to fetch|fetch.*error/i,              msg: 'Erreur réseau. Vérifiez votre connexion et réessayez.' },
    { match: /timeout/i,                                           msg: 'La requête a pris trop de temps. Réessayez.' },
]

export function friendlyError(error, fallback = 'Une erreur est survenue. Réessayez ou contactez l\'administrateur.') {
    if (!error) return fallback
    const raw = (error.message || String(error)).toLowerCase()
    for (const entry of DB_ERROR_MAP) {
        if (entry.match.test(raw)) return entry.msg
    }
    return fallback
}
