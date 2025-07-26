import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import requests
import json
from pymongo import MongoClient
import numpy as np

# Page configuration
st.set_page_config(
    page_title="Git Developer Analytics Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# MongoDB connection
@st.cache_resource
def init_connection():
    try:
        client = MongoClient('mongodb://localhost:27017')
        db = client['gitAnalytics']
        return db.commits
    except Exception as e:
        st.error(f"Failed to connect to MongoDB: {e}")
        return None

# Data fetching functions
@st.cache_data(ttl=300)  # Cache for 5 minutes
def fetch_commits():
    collection = init_connection()
    if collection is None:
        return pd.DataFrame()
    
    try:
        commits = list(collection.find())
        if not commits:
            return pd.DataFrame()
        
        # Convert to DataFrame
        data = []
        for commit in commits:
            # Handle different date formats
            commit_date = commit.get('date')
            if isinstance(commit_date, str):
                try:
                    parsed_date = pd.to_datetime(commit_date)
                except:
                    parsed_date = pd.NaT
            else:
                parsed_date = pd.to_datetime(commit_date)
            
            data.append({
                'commit_id': commit.get('commitId', ''),
                'author_name': commit.get('author', {}).get('name', ''),
                'author_email': commit.get('author', {}).get('email', ''),
                'date': parsed_date,
                'files_changed': len(commit.get('files', [])),
                'insertions': commit.get('lines', {}).get('insertions', 0),
                'deletions': commit.get('lines', {}).get('deletions', 0),
                'files': commit.get('files', []),
                'repository': commit.get('repository', 'unknown')
            })
        
        df = pd.DataFrame(data)
        
        # Only process datetime operations if we have valid dates
        if not df.empty and df['date'].notna().any():
            df['total_changes'] = df['insertions'] + df['deletions']
            df['hour'] = df['date'].dt.hour
            df['day_of_week'] = df['date'].dt.day_name()
            df['date_only'] = df['date'].dt.date
        else:
            # Add empty columns if no valid dates
            df['total_changes'] = df['insertions'] + df['deletions']
            df['hour'] = 0
            df['day_of_week'] = 'Unknown'
            df['date_only'] = None
        
        return df
    except Exception as e:
        st.error(f"Error fetching data: {e}")
        return pd.DataFrame()

def main():
    st.title("📊 Git Developer Analytics Dashboard")
    st.markdown("*Analyzing commit history, file changes, authorship, and timestamps for comprehensive team insights*")
    st.markdown("---")
    
    # Fetch data
    df = fetch_commits()
    
    if df.empty:
        st.warning("No commit data found. Make sure your MongoDB is running and contains data.")
        st.info("Run your Node.js scripts to populate the database first.")
        return
    
    # Sidebar filters
    st.sidebar.header("🔍 Filters")
    
    # Repository filter
    repositories = ['All'] + sorted(df['repository'].unique().tolist())
    selected_repo = st.sidebar.selectbox("Select Repository", repositories)
    
    # Date range filter
    min_date = df['date'].min().date()
    max_date = df['date'].max().date()
    
    date_range = st.sidebar.date_input(
        "Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date
    )
    
    # Author filter
    authors = ['All'] + sorted(df['author_name'].unique().tolist())
    selected_author = st.sidebar.selectbox("Select Author", authors)
    
    # Work pattern filters
    st.sidebar.subheader("🕐 Work Pattern Analysis")
    show_late_night = st.sidebar.checkbox("Highlight Late Night Work (10PM-6AM)", value=True)
    show_weekend = st.sidebar.checkbox("Highlight Weekend Work", value=True)
    
    # Apply filters
    filtered_df = df.copy()
    
    if selected_repo != 'All':
        filtered_df = filtered_df[filtered_df['repository'] == selected_repo]
    
    if len(date_range) == 2:
        start_date, end_date = date_range
        filtered_df = filtered_df[
            (filtered_df['date_only'] >= start_date) & 
            (filtered_df['date_only'] <= end_date)
        ]
    
    if selected_author != 'All':
        filtered_df = filtered_df[filtered_df['author_name'] == selected_author]
    
    # Add work pattern classifications
    filtered_df['is_late_night'] = filtered_df['hour'].apply(lambda x: x >= 22 or x <= 6)
    filtered_df['is_weekend'] = filtered_df['day_of_week'].isin(['Saturday', 'Sunday'])
    filtered_df['work_pattern'] = 'Regular Hours'
    filtered_df.loc[filtered_df['is_late_night'], 'work_pattern'] = 'Late Night'
    filtered_df.loc[filtered_df['is_weekend'], 'work_pattern'] = 'Weekend'
    filtered_df.loc[filtered_df['is_late_night'] & filtered_df['is_weekend'], 'work_pattern'] = 'Late Night Weekend'
    
    # Enhanced metrics
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        st.metric("Total Commits", len(filtered_df))
    
    with col2:
        st.metric("Active Developers", filtered_df['author_name'].nunique())
    
    with col3:
        late_night_pct = (filtered_df['is_late_night'].sum() / len(filtered_df) * 100) if len(filtered_df) > 0 else 0
        st.metric("Late Night Work", f"{late_night_pct:.1f}%")
    
    with col4:
        weekend_pct = (filtered_df['is_weekend'].sum() / len(filtered_df) * 100) if len(filtered_df) > 0 else 0
        st.metric("Weekend Work", f"{weekend_pct:.1f}%")
    
    with col5:
        avg_files_per_commit = filtered_df['files_changed'].mean() if len(filtered_df) > 0 else 0
        st.metric("Avg Files/Commit", f"{avg_files_per_commit:.1f}")
    
    st.markdown("---")
    
    # Enhanced tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📈 Productivity Trends", 
        "👥 Developer Analytics", 
        "⏰ Work Patterns", 
        "🤝 Collaboration", 
        "📁 Code Ownership"
    ])
    
    with tab1:
        st.subheader("📈 Developer Productivity and Activity Trends")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Daily productivity trend
            daily_stats = filtered_df.groupby('date_only').agg({
                'commit_id': 'count',
                'total_changes': 'sum',
                'files_changed': 'sum'
            }).reset_index()
            daily_stats.columns = ['date', 'commits', 'total_changes', 'files_changed']
            
            fig_productivity = px.line(
                daily_stats, 
                x='date', 
                y=['commits', 'total_changes'],
                title="Daily Productivity: Commits vs Code Changes",
                markers=True
            )
            fig_productivity.update_layout(height=400)
            st.plotly_chart(fig_productivity, use_container_width=True)
        
        with col2:
            # Author productivity comparison
            author_productivity = filtered_df.groupby('author_name').agg({
                'commit_id': 'count',
                'total_changes': 'sum',
                'files_changed': 'sum'
            }).reset_index()
            author_productivity['productivity_score'] = (
                author_productivity['commit_id'] * 0.3 + 
                author_productivity['total_changes'] * 0.0001 + 
                author_productivity['files_changed'] * 0.1
            )
            author_productivity = author_productivity.sort_values('productivity_score', ascending=False).head(10)
            
            fig_author_prod = px.bar(
                author_productivity,
                x='author_name',
                y='productivity_score',
                title="Developer Productivity Score (Top 10)",
                color='productivity_score',
                color_continuous_scale='Viridis'
            )
            fig_author_prod.update_layout(height=400, xaxis_tickangle=-45)
            st.plotly_chart(fig_author_prod, use_container_width=True)
        
        # Weekly trend with work patterns
        filtered_df['week'] = filtered_df['date'].dt.to_period('W').astype(str)
        weekly_patterns = filtered_df.groupby(['week', 'work_pattern']).size().unstack(fill_value=0).reset_index()
        
        fig_weekly_patterns = px.bar(
            weekly_patterns,
            x='week',
            y=['Regular Hours', 'Late Night', 'Weekend', 'Late Night Weekend'],
            title="Weekly Commit Patterns: Regular vs Late Night vs Weekend Work",
            barmode='stack'
        )
        fig_weekly_patterns.update_layout(height=400, xaxis_tickangle=-45)
        st.plotly_chart(fig_weekly_patterns, use_container_width=True)
    
    with tab2:
        st.subheader("👥 Individual Developer Analytics")
        
        # Developer performance metrics
        author_stats = filtered_df.groupby('author_name').agg({
            'commit_id': 'count',
            'insertions': 'sum',
            'deletions': 'sum',
            'total_changes': 'sum',
            'files_changed': 'sum',
            'is_late_night': 'sum',
            'is_weekend': 'sum'
        }).reset_index()
        
        author_stats['avg_changes_per_commit'] = author_stats['total_changes'] / author_stats['commit_id']
        author_stats['avg_files_per_commit'] = author_stats['files_changed'] / author_stats['commit_id']
        author_stats['late_night_percentage'] = (author_stats['is_late_night'] / author_stats['commit_id'] * 100)
        author_stats['weekend_percentage'] = (author_stats['is_weekend'] / author_stats['commit_id'] * 100)
        
        author_stats.columns = ['Developer', 'Total Commits', 'Insertions', 'Deletions', 'Total Changes', 
                               'Files Changed', 'Late Night Commits', 'Weekend Commits', 'Avg Changes/Commit', 
                               'Avg Files/Commit', 'Late Night %', 'Weekend %']
        
        author_stats = author_stats.sort_values('Total Commits', ascending=False)
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Developer contribution summary
            fig_contribution = px.pie(
                author_stats.head(10),
                values='Total Commits',
                names='Developer',
                title="Contribution Distribution (Top 10 Developers)"
            )
            fig_contribution.update_layout(height=400)
            st.plotly_chart(fig_contribution, use_container_width=True)
        
        with col2:
            # Work-life balance indicator
            fig_worklife = px.scatter(
                author_stats,
                x='Late Night %',
                y='Weekend %',
                size='Total Commits',
                hover_name='Developer',
                title="Work-Life Balance Analysis",
                labels={'Late Night %': 'Late Night Work %', 'Weekend %': 'Weekend Work %'}
            )
            fig_worklife.update_layout(height=400)
            st.plotly_chart(fig_worklife, use_container_width=True)
        
        # Developer efficiency metrics
        st.subheader("Developer Efficiency Metrics")
        efficiency_cols = ['Developer', 'Total Commits', 'Avg Changes/Commit', 'Avg Files/Commit', 
                          'Late Night %', 'Weekend %']
        st.dataframe(author_stats[efficiency_cols].head(15), use_container_width=True)
    
    with tab3:
        st.subheader("⏰ Late-night and Weekend Work Patterns")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Work pattern distribution
            pattern_counts = filtered_df['work_pattern'].value_counts()
            fig_patterns = px.pie(
                values=pattern_counts.values,
                names=pattern_counts.index,
                title="Work Pattern Distribution",
                color_discrete_map={
                    'Regular Hours': '#2E8B57',
                    'Late Night': '#FF6347',
                    'Weekend': '#4169E1',
                    'Late Night Weekend': '#8B0000'
                }
            )
            fig_patterns.update_layout(height=400)
            st.plotly_chart(fig_patterns, use_container_width=True)
        
        with col2:
            # Hourly activity with late night highlighting
            hourly_commits = filtered_df.groupby('hour').size().reset_index()
            hourly_commits.columns = ['hour', 'commits']
            hourly_commits['is_late_night'] = hourly_commits['hour'].apply(lambda x: x >= 22 or x <= 6)
            
            fig_hourly = px.bar(
                hourly_commits,
                x='hour',
                y='commits',
                title="Commits by Hour (Late Night Highlighted)",
                color='is_late_night',
                color_discrete_map={True: '#FF6347', False: '#2E8B57'}
            )
            fig_hourly.update_layout(height=400, showlegend=False)
            st.plotly_chart(fig_hourly, use_container_width=True)
        
        # Developer work pattern analysis
        st.subheader("Individual Work Pattern Analysis")
        dev_patterns = filtered_df.groupby(['author_name', 'work_pattern']).size().unstack(fill_value=0)
        dev_patterns['total'] = dev_patterns.sum(axis=1)
        dev_patterns = dev_patterns.sort_values('total', ascending=False).head(10)
        
        # Calculate percentages
        for col in ['Regular Hours', 'Late Night', 'Weekend', 'Late Night Weekend']:
            if col in dev_patterns.columns:
                dev_patterns[f'{col}_pct'] = (dev_patterns[col] / dev_patterns['total'] * 100).round(1)
        
        fig_dev_patterns = px.bar(
            dev_patterns.reset_index(),
            x='author_name',
            y=['Regular Hours', 'Late Night', 'Weekend', 'Late Night Weekend'],
            title="Work Patterns by Developer (Top 10 by Total Commits)",
            barmode='stack'
        )
        fig_dev_patterns.update_layout(height=400, xaxis_tickangle=-45)
        st.plotly_chart(fig_dev_patterns, use_container_width=True)
        
        # Activity Heatmap
        st.subheader("Team Activity Heatmap")
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        heatmap_data = filtered_df.groupby(['day_of_week', 'hour']).size().unstack(fill_value=0)
        heatmap_data = heatmap_data.reindex(day_order)
        
        fig_heatmap = px.imshow(
            heatmap_data.values,
            x=heatmap_data.columns,
            y=heatmap_data.index,
            title="Commit Activity Heatmap (Day vs Hour)",
            color_continuous_scale="Reds",
            labels={'x': 'Hour of Day', 'y': 'Day of Week', 'color': 'Commits'}
        )
        fig_heatmap.update_layout(height=500)
        st.plotly_chart(fig_heatmap, use_container_width=True)
    
    with tab4:
        st.subheader("🤝 Collaboration and Team Behavior Analysis")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # File overlap analysis - developers working on same files
            file_author_map = {}
            for _, row in filtered_df.iterrows():
                for file in row['files']:
                    if file not in file_author_map:
                        file_author_map[file] = set()
                    file_author_map[file].add(row['author_name'])
            
            # Find files with multiple contributors
            collaborative_files = {file: authors for file, authors in file_author_map.items() if len(authors) > 1}
            
            if collaborative_files:
                collab_data = []
                for file, authors in collaborative_files.items():
                    collab_data.append({
                        'file': file,
                        'contributors': len(authors),
                        'authors': ', '.join(list(authors)[:3]) + ('...' if len(authors) > 3 else '')
                    })
                
                collab_df = pd.DataFrame(collab_data).sort_values('contributors', ascending=False).head(15)
                
                fig_collab_files = px.bar(
                    collab_df,
                    x='contributors',
                    y='file',
                    orientation='h',
                    title="Most Collaborative Files (Multiple Contributors)",
                    hover_data=['authors']
                )
                fig_collab_files.update_layout(height=500)
                st.plotly_chart(fig_collab_files, use_container_width=True)
            else:
                st.info("No collaborative files found in the selected data.")
        
        with col2:
            # Developer interaction matrix
            author_pairs = []
            for file, authors in file_author_map.items():
                if len(authors) > 1:
                    authors_list = list(authors)
                    for i in range(len(authors_list)):
                        for j in range(i+1, len(authors_list)):
                            author_pairs.append((authors_list[i], authors_list[j]))
            
            if author_pairs:
                pair_counts = pd.Series(author_pairs).value_counts().head(10)
                pair_df = pd.DataFrame({
                    'pair': [f"{pair[0]} ↔ {pair[1]}" for pair in pair_counts.index],
                    'shared_files': pair_counts.values
                })
                
                fig_pairs = px.bar(
                    pair_df,
                    x='shared_files',
                    y='pair',
                    orientation='h',
                    title="Top Developer Collaborations (Shared Files)"
                )
                fig_pairs.update_layout(height=400)
                st.plotly_chart(fig_pairs, use_container_width=True)
            else:
                st.info("No developer collaborations found in the selected data.")
        
        # Team collaboration metrics
        st.subheader("Team Collaboration Metrics")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            total_files = len(file_author_map)
            collaborative_file_count = len(collaborative_files)
            collab_percentage = (collaborative_file_count / total_files * 100) if total_files > 0 else 0
            st.metric("Collaborative Files", f"{collaborative_file_count}/{total_files} ({collab_percentage:.1f}%)")
        
        with col2:
            avg_contributors_per_file = np.mean([len(authors) for authors in file_author_map.values()]) if file_author_map else 0
            st.metric("Avg Contributors/File", f"{avg_contributors_per_file:.2f}")
        
        with col3:
            unique_pairs = len(set(author_pairs)) if author_pairs else 0
            st.metric("Unique Collaborations", unique_pairs)
    
    with tab5:
        st.subheader("📁 Code Ownership and Contribution Summaries")
        
        # File ownership analysis
        file_ownership = {}
        for _, row in filtered_df.iterrows():
            author = row['author_name']
            for file in row['files']:
                if file not in file_ownership:
                    file_ownership[file] = {}
                if author not in file_ownership[file]:
                    file_ownership[file][author] = 0
                file_ownership[file][author] += 1
        
        # Determine primary owners (most commits per file)
        file_owners = []
        for file, authors in file_ownership.items():
            if authors:
                primary_owner = max(authors.items(), key=lambda x: x[1])
                total_commits = sum(authors.values())
                ownership_percentage = (primary_owner[1] / total_commits * 100)
                
                file_owners.append({
                    'file': file,
                    'primary_owner': primary_owner[0],
                    'owner_commits': primary_owner[1],
                    'total_commits': total_commits,
                    'ownership_percentage': ownership_percentage,
                    'contributors': len(authors)
                })
        
        ownership_df = pd.DataFrame(file_owners).sort_values('total_commits', ascending=False)
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Files by ownership strength
            fig_ownership = px.histogram(
                ownership_df,
                x='ownership_percentage',
                nbins=20,
                title="File Ownership Distribution",
                labels={'ownership_percentage': 'Primary Owner %', 'count': 'Number of Files'}
            )
            fig_ownership.update_layout(height=400)
            st.plotly_chart(fig_ownership, use_container_width=True)
        
        with col2:
            # Developer ownership summary
            owner_summary = ownership_df.groupby('primary_owner').agg({
                'file': 'count',
                'owner_commits': 'sum',
                'ownership_percentage': 'mean'
            }).reset_index()
            owner_summary.columns = ['Developer', 'Files Owned', 'Total Commits', 'Avg Ownership %']
            owner_summary = owner_summary.sort_values('Files Owned', ascending=False).head(10)
            
            fig_owner_summary = px.bar(
                owner_summary,
                x='Developer',
                y='Files Owned',
                title="Files Owned by Developer (Primary Owner)",
                color='Avg Ownership %',
                color_continuous_scale='Viridis'
            )
            fig_owner_summary.update_layout(height=400, xaxis_tickangle=-45)
            st.plotly_chart(fig_owner_summary, use_container_width=True)
        
        # Detailed ownership table
        st.subheader("Detailed File Ownership Analysis")
        
        # Filter for most active files
        top_files = ownership_df.head(20)[['file', 'primary_owner', 'ownership_percentage', 'contributors', 'total_commits']]
        top_files['ownership_percentage'] = top_files['ownership_percentage'].round(1)
        
        st.dataframe(top_files, use_container_width=True)
        
        # Module/directory ownership analysis
        st.subheader("Module Ownership Analysis")
        
        # Extract directory/module from file paths
        ownership_df['module'] = ownership_df['file'].apply(lambda x: '/'.join(x.split('/')[:-1]) if '/' in x else 'root')
        
        module_ownership = ownership_df.groupby(['module', 'primary_owner']).agg({
            'file': 'count',
            'owner_commits': 'sum'
        }).reset_index()
        
        # Get top modules by activity
        top_modules = module_ownership.groupby('module')['owner_commits'].sum().sort_values(ascending=False).head(10).index
        
        module_filtered = module_ownership[module_ownership['module'].isin(top_modules)]
        
        if not module_filtered.empty:
            fig_module_ownership = px.bar(
                module_filtered,
                x='module',
                y='owner_commits',
                color='primary_owner',
                title="Module Ownership by Developer (Top 10 Active Modules)",
                barmode='stack'
            )
            fig_module_ownership.update_layout(height=400, xaxis_tickangle=-45)
            st.plotly_chart(fig_module_ownership, use_container_width=True)
    
    # Raw data section
    st.markdown("---")
    st.subheader("📋 Raw Commit Data")
    
    # Display options
    show_raw = st.checkbox("Show raw commit data")
    if show_raw:
        display_df = filtered_df[['commit_id', 'author_name', 'date', 'files_changed', 'insertions', 'deletions']].copy()
        display_df['date'] = display_df['date'].dt.strftime('%Y-%m-%d %H:%M:%S')
        st.dataframe(display_df, use_container_width=True)
    
    # Export functionality
    st.markdown("---")
    st.subheader("📥 Export Data")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("Download Filtered Data as CSV"):
            csv = filtered_df.to_csv(index=False)
            st.download_button(
                label="Download CSV",
                data=csv,
                file_name=f"git_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv"
            )
    
    with col2:
        if st.button("Download Author Summary as JSON"):
            author_summary = author_stats.to_dict('records')
            json_str = json.dumps(author_summary, indent=2)
            st.download_button(
                label="Download JSON",
                data=json_str,
                file_name=f"author_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json"
            )

if __name__ == "__main__":
    main()