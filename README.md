🎬 Movie & TV Show Recommendation Platform
A modern, mobile-first movie and TV show recommendation platform. The application leverages an Advanced Hybrid Recommendation System (incorporating both Collaborative & Content-Based Filtering) to deliver highly personalized content streams to its users.

🛠️ Tech Stack & Architecture
Frontend: React, TypeScript, Vite, Tailwind CSS, CSS Modules

Backend & Database: Supabase (PostgreSQL, Stored Procedures/RPC, Auth Module)

Data Provider: TMDB API (The Movie Database)

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