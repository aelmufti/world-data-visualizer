# Requirements Document

## Introduction

Ce document définit les exigences pour un système d'agrégation multi-sources d'actualités destiné à améliorer la pertinence des actualités affichées dans l'application d'analyse sectorielle. Le système actuel récupère des actualités d'une seule source à la fois (NewsAPI → Bing → Google en cascade) avec des mots-clés génériques, ce qui produit des résultats peu pertinents pour l'analyse sectorielle. Par exemple, une guerre au Moyen-Orient avec l'Iran bloquant le détroit d'Ormuz (impact majeur sur le secteur Énergie) n'apparaît pas dans les actualités du secteur Énergie.

Le nouveau système agrégera simultanément des actualités de multiples sources, les filtrera intelligemment selon leur pertinence sectorielle, et fournira des actualités beaucoup plus pertinentes pour chaque secteur analysé.

## Glossary

- **News_Aggregator**: Le système backend qui récupère, agrège et filtre les actualités de multiples sources
- **News_Source**: Une API ou flux RSS fournissant des actualités (NewsAPI, Bing News, Google News, etc.)
- **Sector**: Un domaine d'activité économique analysé (Énergie, Technologie, Santé, Télécoms, Industrie, Services Publics)
- **Relevance_Score**: Un score numérique (0-1) indiquant la pertinence d'une actualité pour un secteur donné
- **Article**: Une actualité individuelle avec titre, description, date, source et URL
- **Aggregation_Result**: L'ensemble des actualités agrégées et filtrées pour un secteur donné
- **Sector_Keywords**: Liste de mots-clés et expressions associés à un secteur pour la recherche d'actualités
- **Deduplication**: Processus d'identification et d'élimination des actualités en double provenant de sources différentes

## Requirements

### Requirement 1: Agrégation Multi-Sources Parallèle

**User Story:** En tant que système backend, je veux récupérer des actualités de multiples sources simultanément, afin d'obtenir une couverture maximale des événements pertinents pour chaque secteur.

#### Acceptance Criteria

1. WHEN a sector news request is received, THE News_Aggregator SHALL fetch articles from all configured News_Sources in parallel
2. THE News_Aggregator SHALL support at least three News_Sources (NewsAPI, Bing News RSS, Google News RSS)
3. WHEN a News_Source fails or times out, THE News_Aggregator SHALL continue processing with remaining sources
4. THE News_Aggregator SHALL complete all parallel fetches within 5 seconds maximum
5. THE News_Aggregator SHALL retrieve at least 10 articles per News_Source when available

### Requirement 2: Mots-Clés Sectoriels Enrichis

**User Story:** En tant qu'analyste sectoriel, je veux que le système utilise des mots-clés riches et contextuels pour chaque secteur, afin de capturer les actualités ayant un impact indirect mais significatif sur le secteur.

#### Acceptance Criteria

1. THE News_Aggregator SHALL maintain an enriched Sector_Keywords mapping for each Sector
2. FOR the Énergie Sector, THE Sector_Keywords SHALL include terms related to geopolitical events affecting energy supply (e.g., "Strait of Hormuz", "OPEC", "pipeline", "sanctions")
3. FOR the Technologie Sector, THE Sector_Keywords SHALL include terms related to AI, software, semiconductors, and tech regulation
4. FOR the Santé Sector, THE Sector_Keywords SHALL include terms related to pharmaceuticals, biotech, medical devices, and healthcare policy
5. FOR the Télécoms Sector, THE Sector_Keywords SHALL include terms related to 5G, telecommunications infrastructure, and spectrum auctions
6. FOR the Industrie Sector, THE Sector_Keywords SHALL include terms related to manufacturing, aerospace, defense, and supply chain
7. FOR the Services Publics Sector, THE Sector_Keywords SHALL include terms related to utilities, electricity, water, and infrastructure
8. THE News_Aggregator SHALL use multiple keyword variations per Sector (minimum 8 keywords per sector)

### Requirement 3: Scoring de Pertinence

**User Story:** En tant que système d'analyse, je veux attribuer un score de pertinence à chaque actualité pour un secteur donné, afin de prioriser les actualités les plus impactantes.

#### Acceptance Criteria

1. WHEN an Article is retrieved, THE News_Aggregator SHALL calculate a Relevance_Score for the target Sector
2. THE Relevance_Score SHALL be a numeric value between 0 and 1
3. THE News_Aggregator SHALL consider keyword frequency in title and description when calculating Relevance_Score
4. THE News_Aggregator SHALL assign higher weight to keywords appearing in the Article title versus description
5. THE News_Aggregator SHALL consider article recency when calculating Relevance_Score (more recent articles score higher)
6. WHEN an Article contains multiple Sector_Keywords, THE News_Aggregator SHALL increase the Relevance_Score proportionally

### Requirement 4: Déduplication des Actualités

**User Story:** En tant qu'utilisateur final, je veux voir des actualités uniques sans doublons, afin d'avoir une vue claire et non répétitive des événements.

#### Acceptance Criteria

1. WHEN multiple News_Sources return similar Articles, THE News_Aggregator SHALL perform Deduplication
2. THE News_Aggregator SHALL consider two Articles as duplicates when their titles have more than 70% similarity
3. WHEN duplicate Articles are detected, THE News_Aggregator SHALL keep the Article with the highest Relevance_Score
4. WHEN duplicate Articles have equal Relevance_Score, THE News_Aggregator SHALL keep the most recent Article
5. THE Deduplication process SHALL complete within 500 milliseconds for up to 50 articles

### Requirement 5: Filtrage et Sélection des Actualités

**User Story:** En tant qu'utilisateur final, je veux voir uniquement les actualités les plus pertinentes pour le secteur consulté, afin de ne pas être submergé par des informations peu utiles.

#### Acceptance Criteria

1. WHEN the Aggregation_Result is prepared, THE News_Aggregator SHALL sort Articles by Relevance_Score in descending order
2. THE News_Aggregator SHALL return only Articles with a Relevance_Score above 0.3
3. THE News_Aggregator SHALL return a maximum of 20 articles per Sector
4. WHEN fewer than 5 articles meet the relevance threshold, THE News_Aggregator SHALL lower the threshold to 0.2 to return at least 5 articles
5. THE News_Aggregator SHALL include Article metadata (title, snippet, date, source, URL, Relevance_Score) in the Aggregation_Result

### Requirement 6: Gestion des Erreurs et Résilience

**User Story:** En tant que système backend, je veux gérer gracieusement les erreurs de sources d'actualités, afin de toujours fournir un résultat même si certaines sources échouent.

#### Acceptance Criteria

1. WHEN a News_Source returns an error, THE News_Aggregator SHALL log the error and continue with other sources
2. WHEN a News_Source times out after 3 seconds, THE News_Aggregator SHALL cancel the request and continue with other sources
3. WHEN all News_Sources fail, THE News_Aggregator SHALL return an empty Aggregation_Result with an error message
4. THE News_Aggregator SHALL include source availability status in the response metadata
5. WHEN a News_Source consistently fails (3 consecutive failures), THE News_Aggregator SHALL log a warning for monitoring

### Requirement 7: Configuration des Sources d'Actualités

**User Story:** En tant qu'administrateur système, je veux pouvoir configurer et activer/désactiver les sources d'actualités, afin de contrôler quelles sources sont utilisées sans modifier le code.

#### Acceptance Criteria

1. THE News_Aggregator SHALL read News_Source configurations from environment variables or configuration file
2. WHERE a News_Source requires an API key, THE News_Aggregator SHALL validate the key before attempting to fetch articles
3. THE News_Aggregator SHALL support enabling or disabling individual News_Sources via configuration
4. WHEN a News_Source is disabled in configuration, THE News_Aggregator SHALL skip that source during aggregation
5. THE News_Aggregator SHALL log which News_Sources are active at startup

### Requirement 8: Performance et Mise en Cache

**User Story:** En tant que système backend, je veux mettre en cache les résultats d'agrégation, afin de réduire les appels API et améliorer les temps de réponse.

#### Acceptance Criteria

1. THE News_Aggregator SHALL cache Aggregation_Results for each Sector
2. THE News_Aggregator SHALL set cache expiration to 15 minutes
3. WHEN a cached Aggregation_Result exists and is not expired, THE News_Aggregator SHALL return the cached result
4. WHEN a cached Aggregation_Result is expired, THE News_Aggregator SHALL fetch fresh articles and update the cache
5. THE News_Aggregator SHALL include cache status (hit/miss) and timestamp in response metadata

### Requirement 9: Métriques et Observabilité

**User Story:** En tant qu'administrateur système, je veux suivre les performances et la qualité de l'agrégation d'actualités, afin d'identifier les problèmes et optimiser le système.

#### Acceptance Criteria

1. THE News_Aggregator SHALL log the number of articles fetched from each News_Source
2. THE News_Aggregator SHALL log the total aggregation time for each request
3. THE News_Aggregator SHALL log the number of articles after deduplication
4. THE News_Aggregator SHALL log the average Relevance_Score of returned articles
5. THE News_Aggregator SHALL log News_Source failures with error details

### Requirement 10: API Response Format

**User Story:** En tant que client frontend, je veux recevoir les actualités agrégées dans un format structuré et cohérent, afin de les afficher facilement dans l'interface utilisateur.

#### Acceptance Criteria

1. THE News_Aggregator SHALL return Aggregation_Results in JSON format
2. THE response SHALL include an array of Articles with fields: title, snippet, date, source, url, relevanceScore
3. THE response SHALL include metadata with fields: timestamp, totalArticles, sourcesUsed, cacheStatus
4. THE response SHALL include human-readable date formatting in French (e.g., "Il y a 2h", "Hier", "Il y a 3 jours")
5. WHEN an error occurs, THE News_Aggregator SHALL return a response with an empty articles array and an error field describing the issue
