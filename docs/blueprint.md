# **App Name**: ProspectIQ

## Core Features:

- User Authentication: User authentication via email/password using Firebase Auth.
- Lead Search UI: Form for entering search keywords and optional industry/category to generate leads.
- AI-Powered Scraping: AI tool (powered by LLM) uses DuckDuckGo or Bing to search for business directories, scrapes websites to extract name, email, phone number, and website, and suggests alternate but semantically identical queries.
- Lead Display & Export: Display the generated leads in a responsive, sortable table with options to export to CSV.
- Saved Leads Management: Page to view and manage saved leads with options to add labels/tags or delete them.
- Adjustable Search Radius: Enable users to select whether they want search to focus on local or broad geography (can provide different search engine queries)
- Filter Search Results: Provide search result filters, enabling users to refine lead results based on the categories: scraped email, presence of listed phone number, domain authority, etc.

## Style Guidelines:

- Primary color: A deep indigo (#4B0082), reflecting intelligence, efficiency and depth, fitting for an app providing insights.
- Background color: Very light gray (#F0F0F0), offering a neutral, clean backdrop that ensures focus on data.
- Accent color: A vivid purple (#BE49F1), used to draw attention to key interactive elements.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines, giving a modern tech-forward feel, paired with 'Inter' (sans-serif) for body text, which has excellent readability.
- Use minimalist icons from Phosphor or Tabler Icons to represent different categories and actions within the app.
- Employ a clean, card-based layout to display leads and search results, optimizing for readability and user experience.
- Incorporate subtle animations and transitions using Framer Motion to enhance user engagement and provide feedback on interactions.