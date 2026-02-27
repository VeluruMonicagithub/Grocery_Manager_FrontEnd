#  My Pantry - Intelligent Grocery & Kitchen Manager

My Pantry is a state-of-the-art, full-stack application designed to revolutionize how households manage their food inventory, plan meals, and reduce waste. By combining real-time inventory tracking with Generative AI, My Pantry turns a simple list into an intelligent kitchen assistant.

## Deployed Links
*   **Live Application**: [Click here to view the App](DEPLOYMENT_LINK_HERE)
*   **Backend API**: [View API Service](BACKEND_API_LINK_HERE)
*   **Video Demo**: [Watch the Walkthrough](VIDEO_LINK_HERE)

##  Test Credentials
*   **Email**: `test@example.com`
*   **Password**: `password123`

---

##  Features

###  Intelligent Inventory & Shopping
*   **Smart Pantry**: Real-time tracking of quantities, units, and categories with automated low-stock detection.
*   **Dynamic Shopping List**: One-click "Add to List" for low-stock items with automatic pantry sync upon trip completion.
*   **Budget Guard**: Set monthly budget limits and track spending in real-time with visual indicators.

###  AI-Powered Kitchen Assistant
*   **AI Chef**: A conversational bot (powered by Gemini) that knows your pantry and suggests recipes based on your specific ingredients.
*   **Smart Estimation**: AI-driven price estimation for groceries and nutritional analysis for recipes.

###  Household Collaboration
*   **Shared Access**: Generate secure invite links for family members to manage a single shared pantry in real-time.
*   **Guest Mode**: Instant-access sharing for temporary household guests.

###  Health & Spending Analytics
*   **Visual Insights**: Beautifully rendered charts showing spending trends and nutritional intake (Calories, Protein, Carbs, Fat).
*   **Expiration Alerts**: Automated tracking and alerts for items expiring within 7 days.

---

##  Tech Stack
*   **Frontend**: React.js (Vite)
*   **Styling**: Tailwind CSS
*   **UI Components**: ShadCN UI + Framer Motion
*   **State Management**: React Context API
*   **Icons**: Lucide React
*   **HTTP Client**: Axios

---

##  Folder Structure
*   `src/components`: Reusable UI components and complex layout structures.
*   `src/pages`: Main application views and routing logic.
*   `src/context`: Global state management for Auth, Theme, and Notifications.
*   `src/services`: Centralized Axios instance and API call orchestration.
*   `src/utils`: Helper functions and schema validators.

---

##  Installation Steps

1.  **Clone the Repository**:
    ```bash
    git clone [FRONTEND_REPO_URL]
    cd frontend
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    Create a `.env` file in the root:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_API_URL=http://localhost:5001/api
    ```
4.  **Launch Dashboard**:
    ```bash
    npm run dev
    ```

---

##  Screenshots
![Dashboard Preview]()
![AI Chef Preview]()
