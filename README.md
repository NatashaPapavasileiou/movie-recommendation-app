🎬 Movie & TV Show Recommendation Platform
A modern, mobile-first movie and TV show recommendation platform. The application leverages an Advanced Hybrid Recommendation System (incorporating both Collaborative & Content-Based Filtering) to deliver highly personalized content streams to its users.

🌐 Live Demo
https://d11g05bjaoqqa8.cloudfront.net

🧠 How the Recommendation Algorithm Works
Every time a user opens the Home page, the app builds two personalized rows (movies and TV shows) of up to 12 titles each. The whole pipeline lives in src/modules/recommender/recommendationEngine.ts and is shared with the admin dashboard, so the admin always sees exactly what the user sees.

1. Profile — the user's favorite movies and shows (picked during onboarding or rated 7+) and favorite genres are read from Supabase. Titles the user has already watched or rated are excluded.

2. Four sources, queried in parallel:
   - Watchlist & onboarding — the latest titles in the user's To-Watch list (or their onboarding picks)
   - Content-based ("because you liked X") — TMDB recommendations for the user's latest favorite of the same media type
   - Collaborative filtering ("users like you") — a Supabase RPC that finds users sharing favorites with the current user
   - Genre discovery — top-rated titles in the user's main genre (movie genres are converted to their TV equivalents for the TV row)

3. Fair blending — each source contributes up to 3 titles, then the remaining places are backfilled; duplicates and titles of the wrong media type are removed.

4. Fallback — only if the row is still short: top-rated titles in the user's genres, then this week's trending titles (cold start).

The blending logic (src/modules/recommender/mergeRecommendations.ts) and the genre conversion (genreAnalytics.ts) are covered by unit tests (npm run test:unit).

🗂️ Project Structure
src/pages — one file per route (Home, Movies, TvShows, Watchlist, Auth, PreferenceSetupPage, AdminDashboard)
src/components/layout — Navbar, SearchResults, LoadingOverlay (rendered by App on every page)
src/components/auth — LoginForm, RegisterForm, ResetPassword
src/components/home — RecommendationsRow
src/components/shared — DisplayItems (used by Home, Movies and TV Shows)
src/components/details — MovieOverlay, TvOverlay, Comments, CommentForm
src/components/setup — onboarding preference components
src/components/watchlist — WatchlistColumn, WatchlistCard
src/components/admin — AdminRoute, ExplainabilityPieChart
src/modules/recommender — the hybrid recommendation engine and its four sources
src/modules/admin — admin dashboard data, security audit logging and explainability
src/modules — Supabase client, TMDB endpoints, shared types
SQL — every Supabase table, function, trigger, view and policy (see SQL/README.md)
tests — Playwright end-to-end tests

🛠️ Tech Stack & Architecture
Frontend: React, TypeScript, Vite, Tailwind CSS, CSS Modules

Backend & Database: Supabase (PostgreSQL, Row-Level Security, Stored Procedures/RPC, Auth Module)

Data Provider: TMDB API (The Movie Database)

Testing: Playwright (End-to-End functional testing), Vitest (unit testing of the recommendation algorithm)

Administration: role-based admin dashboard (security audit logs, content and user analytics, explainable recommendations)

Deployment: AWS S3 & CloudFront, automated via GitHub Actions CI/CD

🚀 Installation & Setup Guide
Follow these steps to clone, configure, and run the project locally on your machine:

1. Clone the Repository
Clone the project repository from GitHub and navigate into the project directory:

git clone your-repository-link

cd your-project-folder-name

2. Install Dependencies
Before launching the application, you must install all the required npm packages configured in the package.json file (such as Lucide React, Supabase Client, Axios, etc.):

npm install

3. Configure Environment Variables
Create a file named .env (or .env.local) in the root directory of the project and supply your API keys and database configurations.

Note: Due to Vite's security layer, all environment variables must carry the VITE_ prefix to be accessible on the client side.

VITE_TMDB_API_KEY=your_tmdb_api_key_here

VITE_SUPABASE_URL=your_supabase_project_url_here

VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here

4. Run the Development Server
Execute the following command to boot up Vite's local development server:

npm run dev

Once the server compiles, open your web browser and navigate to the URL displayed in your terminal (typically http://localhost:5173).

🧪 Testing
The project includes two layers of automated testing:

Functional / End-to-End tests (Playwright) — cover the application's main use cases (login, registration, recommendations, search & filters, movie/TV details, watchlist management, rate & review, logout, password reset and admin access). Before running, create a .env.test.local file with TEST_USER_EMAIL and TEST_USER_PASSWORD for a test account (and optionally TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD for the admin tests), then run:

npx playwright test

Unit tests (Vitest) — cover the recommendation blending logic and the genre conversion in isolation:

npm run test:unit

☁️ Deployment / CI-CD
Every push to the main branch automatically triggers a GitHub Actions pipeline that:

1. Installs dependencies
2. Runs the linter and the unit tests — a commit that fails either is never deployed
3. Type-checks and builds the application
4. Deploys the static build output to an AWS S3 bucket
5. Invalidates the AWS CloudFront cache, so the live site always reflects the latest deployment

The pipeline configuration can be found in .github/workflows/deploy.yml.