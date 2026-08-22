🎬 Movie & TV Show Recommendation Platform
A modern, mobile-first movie and TV show recommendation platform. The application leverages an Advanced Hybrid Recommendation System (incorporating both Collaborative & Content-Based Filtering) to deliver highly personalized content streams to its users.

🌐 Live Demo
https://d11g05bjaoqqa8.cloudfront.net

🧠 How the Recommendation Algorithm Works
Every time a user opens the Home page, the app builds up to 7 personalized recommendations by combining two independent sources:

1. Collaborative Filtering ("users like you") — a Supabase RPC function looks up other users who share favorite movies/shows with the current user, and surfaces up to 4 titles those similar users liked that the current user hasn't seen yet.

2. Content-Based Filtering ("because you liked X") — the app takes the user's top 3 favorite titles (chosen during onboarding or rated highly) and asks the TMDB API for official recommendations based on each one.

3. Fallback — if a user has no interaction history yet (e.g. right after registering), the app falls back to popular titles filtered by the user's preferred genres, or general top-rated content if no genre preference exists either.

The results from both sources are then merged and deduplicated into a single list, capped at the top 7 items. This merge/deduplication logic lives in its own module (src/modules/mergeRecommendations.ts) and is covered by unit tests (npm run test:unit), independent of the live TMDB/Supabase data.

🛠️ Tech Stack & Architecture
Frontend: React, TypeScript, Vite, Tailwind CSS, CSS Modules

Backend & Database: Supabase (PostgreSQL, Row-Level Security, Stored Procedures/RPC, Auth Module)

Data Provider: TMDB API (The Movie Database)

Testing: Playwright (End-to-End functional testing), Vitest (unit testing of the recommendation algorithm)

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

Functional / End-to-End tests (Playwright) — cover the application's main use cases (login, registration, recommendations, search, movie/TV details, watchlist management, rate & review, logout). Before running, create a .env.test.local file with TEST_USER_EMAIL and TEST_USER_PASSWORD for a test account, then run:

npx playwright test

Unit tests (Vitest) — cover the hybrid recommendation merge/deduplication logic in isolation:

npm run test:unit

☁️ Deployment / CI-CD
Every push to the main branch automatically triggers a GitHub Actions pipeline that:

1. Installs dependencies and builds the application
2. Deploys the static build output to an AWS S3 bucket
3. Invalidates the AWS CloudFront cache, so the live site always reflects the latest deployment

The pipeline configuration can be found in .github/workflows/deploy.yml.