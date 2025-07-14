# git-dev-analytics
# 🚀 Developer Analytics Dashboard Using Git

---

## 🧾 Project Overview

The **Developer Analytics Dashboard** is a full-stack web application that extracts, processes, and visualizes developer activity data from Git repositories. It helps teams and individuals monitor developer productivity, working patterns, and code contribution trends using commit-level data.

By analyzing commit history, file changes, authorship, and timestamps, the system provides a user-friendly dashboard that reflects:

- Developer productivity and activity
- Commit trends over time
- Late-night or weekend work patterns
- Code ownership and collaboration behavior
- Contribution summaries across the team

The system uses Git command-line parsing via Node.js on the backend and presents visual insights in a React-based frontend with clean and interactive UI components.

---

## 📊 Key Features

- 📅 **Commit Trends**: View daily, weekly, and monthly commit patterns  
- 👤 **Developer Stats**: Track per-developer contribution and activity  
- 🕗 **Working Hours Insight**: Detect late-night or weekend work habits  
- 📂 **Code Ownership**: See who contributes most to which modules  
- 📥 **Downloadable Reports**: Export summaries for team review  

---

## 🏗️ Tech Stack

### Backend (Node.js + Express)
- Git log parsing using `simple-git`  
- RESTful API for commit data  
- MongoDB or PostgreSQL for data storage  

### Frontend (React)
- Axios for backend communication  
- TailwindCSS or Bootstrap for UI components  
- Custom-built charts and tables for visualization  

---

## 📘 Future Enhancements

- Real-time commit tracking via WebSockets  
- GitHub integration for pull request insights  
- Role-based views for managers and contributors  
- Notifications on abnormal activity patterns  

---

## ⚖️ License

This project is licensed under the **Apache License 2.0** – see the `LICENSE` file for details.

