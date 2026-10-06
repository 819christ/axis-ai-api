---
name: iterative-visual-workflow
description: Automatise un flux de développement itératif combinant vérification d'infrastructure, logique back-end, test visuel des états et validation par étapes avant de passer au composant suivant. À utiliser pour les tâches de code web avec rendu visuel.
---

# iterative-visual-workflow

Instructions pour l'agent IA afin d'exécuter des tâches de développement robustes sans boucler ni ignorer les vérifications visuelles.

## Usage

À utiliser dès qu'une fonctionnalité ou un composant web (React/Supabase) nécessite d'être implémenté, testé logiquement et vérifié visuellement dans ses différents états avant validation.

## Steps

1. **Vérification d'infrastructure & Connexion :** Tester la connectivité aux services (Supabase, API) avant toute implémentation.
   * *Vérification :* Confirmer que les endpoints répondent sans erreur 5xx.
2. **Initialisation de la base de données :** Configurer ou valider les tables, colonnes et enregistrements nécessaires en base.
   * *Vérification :* S'assurer que les données mock ou réelles sont bien injectées.
3. **Implémentation du code :** Écrire la logique back-end et les composants front-end associés de manière propre.
   * *Vérification :* Compilation et build sans erreur (ex: `npm run build`).
4. **Test visuel des états :** Vérifier l'interface sous ses différents états (chargement, succès, erreur, vide).
   * *Vérification :* Contrôler la cohérence du rendu visuel par rapport aux attentes.
5. **Validation itérative & Propagation :** Valider l'élément actuel avant de passer au composant lié suivant.
   * *Vérification :* Le parcours utilisateur de bout en bout fonctionne sans blocage.