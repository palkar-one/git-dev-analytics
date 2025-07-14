# git-dev-analytics
# 🚀 Developer Analytics Dashboard Using Git and JIRA

---

## 🧾 Project Overview

The **Developer Analytics Dashboard Using Git and JIRA** is a full-stack web application that extracts, processes, and visualizes developer activity data from Git repositories and JIRA issue trackers. It enables engineering teams and individuals to gain insights into:

- Commit trends and productivity patterns  
- Developer-specific contributions and timelines  
- Task tracking via JIRA ticket IDs  
- Working hours and behavior (late-night/weekend coding)  
- File/module ownership within a project  

The system uses Git command-line parsing and JIRA REST API integration — with no machine learning — to generate actionable insights. All metrics are visualized in an interactive React-based dashboard using libraries like Chart.js or Recharts. The backend is built with Node.js and Express, and data is stored in MongoDB or PostgreSQL.

---

## 📊 Key Features

- 📅 **Commit Trends**: Daily, weekly, monthly commit patterns  
- 👤 **Developer Analytics**: Track per-user contributions  
- 🕗 **Active Hours Visualization**: Identify late-night or weekend coding  
- 📂 **Module Ownership**: Which dev owns which files/folders  
- 🔗 **JIRA Integration**: Extract ticket info from commit messages  
- 📈 **Real-Time Charts**: Visualize data with Chart.js or Recharts  
- 🧾 **Ticket Timeline**: Show duration per JIRA task using commit timestamps  
- 📥 **Export Reports**: Download team summaries as CSV/PDF  

---

## 🏗️ Tech Stack

### Backend (Node.js + Express)
- `simple-git` for Git log parsing  
- JIRA REST API integration  
- REST APIs  
- MongoDB / PostgreSQL  

### Frontend (React)
- Recharts / Chart.js  
- Axios for API integration  
- TailwindCSS or Bootstrap UI  

---

## 📂 Project Structure

