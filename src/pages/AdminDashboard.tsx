// src/pages/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import {
  fetchSecurityLogs,
  fetchMediaEngagementData,
  fetchUserEngagementData,
  fetchUsersForInspection,
  fetchRealExplainedRecommendations,
  type SecuritySummary,
  type MediaAnalyticsItem,
  type UserAnalyticsItem,
  type UserAdminSummary,
  type ExplainedMediaItem,
  type ExplainedRecommendations,
} from '../modules/admin/adminService';
import { ExplainabilityPieChart } from '../components/admin/ExplainabilityPieChart';
import noImage from '../assets/noImage.jpg';
import styles from '../components/admin/AdminDashboard.module.css';
import sourceColors from '../components/admin/sourceColors.module.css';
import {
  ShieldAlert,
  Film,
  Users,
  Sparkles,
  Activity,
  AlertTriangle,
  Calendar,
  Star,
  MessageSquare,
  Bookmark,
  RefreshCw,
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'security' | 'media' | 'users' | 'recs'>('security');
  const [securityData, setSecurityData] = useState<SecuritySummary | null>(null);
  const [mediaData, setMediaData] = useState<MediaAnalyticsItem[]>([]);
  const [userData, setUserData] = useState<UserAnalyticsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Recommendation Explainability State
  const [recUsers, setRecUsers] = useState<UserAdminSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'movie' | 'tv'>('movie');
  const [explanation, setExplanation] = useState<ExplainedRecommendations | null>(null);
  const explainedRecs: ExplainedMediaItem[] = explanation?.items || [];
  const [selectedRecItem, setSelectedRecItem] = useState<ExplainedMediaItem | null>(null);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  // Fetch telemetry and overview metrics
  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'security') {
      const sec = await fetchSecurityLogs(7);
      setSecurityData(sec);
    } else if (activeTab === 'media') {
      const med = await fetchMediaEngagementData();
      setMediaData(med);
    } else if (activeTab === 'users') {
      const usr = await fetchUserEngagementData();
      setUserData(usr);
    } else if (activeTab === 'recs') {
      const users = await fetchUsersForInspection();
      setRecUsers(users);
      if (users.length > 0 && !selectedUserId) {
        const firstUser = users[0].userId;
        setSelectedUserId(firstUser);
        loadUserRecommendations(firstUser, selectedMediaType);
      }
    }
    setLoading(false);
  };

  // Load recommendations and explanation factors for a targeted user
  const loadUserRecommendations = async (userId: string, mediaType: 'movie' | 'tv') => {
    setLoadingRecs(true);
    try {
      const result = await fetchRealExplainedRecommendations(userId, mediaType);
      setExplanation(result);
      setSelectedRecItem(result.items[0] || null);
    } catch (err) {
      console.error('Error fetching explained recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Trigger data reload on active tab change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on tab change
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the tab changes
  }, [activeTab]);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    loadUserRecommendations(userId, selectedMediaType);
  };

  const handleMediaTypeChange = (mediaType: 'movie' | 'tv') => {
    setSelectedMediaType(mediaType);
    if (selectedUserId) {
      loadUserRecommendations(selectedUserId, mediaType);
    }
  };

  // Active-tab class of each tab button (each tab has its own highlight color)
  const TAB_ACTIVE_CLASS = {
    security: styles.tabSecurityActive,
    media: styles.tabMediaActive,
    users: styles.tabUsersActive,
    recs: styles.tabRecsActive,
  };
  const tabClass = (tab: keyof typeof TAB_ACTIVE_CLASS) =>
    `${styles.tabButton} ${activeTab === tab ? TAB_ACTIVE_CLASS[tab] : ''}`;
  const mediaTypeClass = (type: 'movie' | 'tv') =>
    `${styles.mediaTypeButton} ${selectedMediaType === type ? styles.mediaTypeButtonActive : ''}`;
  const severityClass = (severity: string) =>
    `${styles.severityBadge} ${
      severity === 'critical' ? styles.severityCritical : severity === 'warning' ? styles.severityWarning : ''
    }`;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Platform Operations & Security Center</h1>
          <p className={styles.subtitle}>Live Security Auditing, User Activity & Real-Time Content Analytics</p>
        </div>

        {/* Tab Controls & Refresh */}
        <div className={styles.headerControls}>
          <button onClick={loadData} title="Refresh Data" className={styles.refreshButton}>
            <RefreshCw size={14} /> Refresh
          </button>

          <div className={styles.segmented}>
            <button onClick={() => setActiveTab('security')} className={tabClass('security')}>
              <ShieldAlert size={16} /> Security Telemetry
            </button>
            <button onClick={() => setActiveTab('media')} className={tabClass('media')}>
              <Film size={16} /> Content Analytics
            </button>
            <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
              <Users size={16} /> User Telemetry
            </button>
            <button onClick={() => setActiveTab('recs')} className={tabClass('recs')}>
              <Sparkles size={16} /> Explainable Recs
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Updating Live Telemetry...</div>
      ) : activeTab === 'security' ? (
        /* ==================== TAB 1: SECURITY TELEMETRY ==================== */
        <div>
          {/* Top Metric Cards */}
          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Events (Last 7 Days)</span>
                <Calendar size={18} color="#10b981" />
              </div>
              <div className={`${styles.metricValue} ${styles.metricValueGreen}`}>{securityData?.last7DaysCount || 0}</div>
              <div className={styles.metricHint}>Active 7-day rolling window</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Total Recorded (All-Time)</span>
                <Activity size={18} color="#3b82f6" />
              </div>
              <div className={styles.metricValue}>{securityData?.totalEvents || 0}</div>
              <div className={styles.metricHint}>Full platform audit trail</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Critical Alerts (7 Days)</span>
                <AlertTriangle size={18} color="#ef4444" />
              </div>
              <div className={`${styles.metricValue} ${styles.metricValueRed}`}>{securityData?.criticalAlerts || 0}</div>
              <div className={styles.metricHint}>Unauthorized admin escalation</div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span>Warnings & Failures</span>
                <AlertTriangle size={18} color="#f59e0b" />
              </div>
              <div className={`${styles.metricValue} ${styles.metricValueAmber}`}>{securityData?.warningAlerts || 0}</div>
              <div className={styles.metricHint}>Failed logins in last 7 days</div>
            </div>
          </div>

          {/* 7-Day Activity Trend Bar Chart */}
          <div className={`${styles.panel} ${styles.spacedBelow}`}>
            <h3 className={styles.panelTitle}>7-Day Telemetry Volume Trend</h3>
            <div className={styles.barChart}>
              {(securityData?.dailyDistribution || []).map((day) => {
                const maxVal = Math.max(...(securityData?.dailyDistribution.map((d) => d.count) || [1]), 1);
                const barHeight = Math.max(12, Math.round((day.count / maxVal) * 85));
                return (
                  <div key={day.dayLabel} className={styles.barColumn}>
                    <span className={`${styles.barCount} ${day.count > 0 ? styles.barCountActive : ''}`}>{day.count}</span>
                    {/* The height comes from the data, so it is the only value set inline */}
                    <div
                      className={`${styles.bar} ${day.count > 0 ? styles.barActive : ''}`}
                      style={{ height: `${barHeight}px` }}
                    />
                    <span className={styles.barLabel}>{day.dayLabel.split(',')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Incident Telemetry Table */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Live Security Telemetry Feed</h3>
              <span className={styles.mutedNote}>Showing latest 100 events</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.logTable}>
                <thead>
                  <tr>
                    <th>Security Event</th>
                    <th>Severity</th>
                    <th>User ID / Target</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {(securityData?.recentLogs || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyCell}>
                        No security telemetry events logged yet.
                      </td>
                    </tr>
                  ) : (
                    (securityData?.recentLogs || []).map((log) => (
                      <tr key={log.id}>
                        <td className={styles.eventCell}>{log.event_type}</td>
                        <td>
                          <span className={severityClass(log.severity)}>{log.severity.toUpperCase()}</span>
                        </td>
                        <td className={styles.userCell}>
                          {log.user_id ? log.user_id.slice(0, 10) + '...' : 'Anonymous'}
                        </td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'media' ? (
        /* ==================== TAB 2: CONTENT ANALYTICS ==================== */
        <div className={styles.panel}>
          <h3 className={styles.panelTitleLarge}>Dynamic Media Popularity & Engagement Matrix</h3>
          <div className={styles.rankList}>
            {mediaData.length === 0 ? (
              <div className={styles.emptyState}>No media engagement recorded yet.</div>
            ) : (
              mediaData.map((item, idx) => (
                <div key={`${item.media_type}-${item.media_id}`} className={styles.rankRow}>
                  <div className={styles.rankIdentity}>
                    <span className={styles.rankNumber}>#{idx + 1}</span>
                    {item.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt="" className={styles.rankPoster} />
                    )}
                    <div>
                      <div className={styles.rankName}>{item.title}</div>
                      <div className={styles.rankMeta}>{item.media_type.toUpperCase()}</div>
                    </div>
                  </div>
                  <div className={styles.rankStats}>
                    <div><Star size={14} color="#eab308" /> {item.average_rating}</div>
                    <div><MessageSquare size={14} color="#38bdf8" /> {item.comments_count}</div>
                    <div><Bookmark size={14} color="#a78bfa" /> {item.watchlist_count}</div>
                    <div className={styles.engagementScore}>Score: {item.engagement_score}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* ==================== TAB 3: USER TELEMETRY ==================== */
        <div className={styles.panel}>
          <h3 className={styles.panelTitleLarge}>User Engagement & Activity Leaderboard</h3>
          <div className={styles.rankList}>
            {userData.length === 0 ? (
              <div className={styles.emptyState}>No user activity recorded yet.</div>
            ) : (
              userData.map((u, idx) => (
                <div key={u.user_id} className={styles.rankRow}>
                  <div className={styles.rankIdentity}>
                    <span className={styles.rankNumber}>#{idx + 1}</span>
                    <div>
                      <div className={styles.rankName}>ID: {u.user_id.slice(0, 10)}...</div>
                      <div className={styles.rankMeta}>Role: {u.role}</div>
                    </div>
                  </div>
                  <div className={styles.rankStats}>
                    <div>Comments: <strong className={styles.statBlue}>{u.total_comments}</strong></div>
                    <div>Watched: <strong className={styles.statGreen}>{u.total_watched}</strong></div>
                    <div>Activity Score: <strong className={styles.statPurple}>{u.user_activity_score}</strong></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ==================== TAB 4: RECOMMENDATION EXPLAINABILITY (XAI) ==================== */
        <div>
          {/* Media Type Switcher: Movies / TV Shows */}
          <div className={styles.header}>
            <div>
              <h2 className={styles.sectionHeading}>Hybrid Recommender Explainability (XAI)</h2>
              <p className={styles.sectionDescription}>
                The same engine as the user's home page row: which source produced each title, and why
              </p>
            </div>
            <div className={styles.segmented}>
              <button onClick={() => handleMediaTypeChange('movie')} className={mediaTypeClass('movie')}>
                Movies
              </button>
              <button onClick={() => handleMediaTypeChange('tv')} className={mediaTypeClass('tv')}>
                TV Shows
              </button>
            </div>
          </div>

          {/* Master-Detail Split View */}
          <div className={styles.masterDetail}>
            {/* 1. Target User Selector */}
            <div className={`${styles.panel} ${styles.panelCompact}`}>
              <h3 className={styles.panelTitle}>Select Target User</h3>
              <div className={styles.userList}>
                {recUsers.map((u) => (
                  <div
                    key={u.userId}
                    onClick={() => handleSelectUser(u.userId)}
                    className={`${styles.userItem} ${selectedUserId === u.userId ? styles.userItemSelected : ''}`}
                  >
                    <div className={styles.userItemId}>ID: {u.userId.slice(0, 10)}...</div>
                    <div className={styles.userItemMeta}>
                      🎬 {u.favoriteMoviesCount} movies • 📺 {u.favoriteShowsCount} shows
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Recommended Items Grid */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  Recommended {selectedMediaType === 'movie' ? 'Movies' : 'TV Shows'} ({explainedRecs.length})
                </h3>
                <span className={styles.mutedNote}>Click a title to see why it was recommended</span>
              </div>

              {loadingRecs ? (
                <div className={styles.emptyState}>Building this user's recommendations...</div>
              ) : explainedRecs.length === 0 ? (
                <div className={styles.emptyState}>No recommendations found for this user.</div>
              ) : (
                <div className={styles.recGrid}>
                  {explainedRecs.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedRecItem(item)}
                      className={`${styles.recCard} ${selectedRecItem?.id === item.id ? styles.recCardSelected : ''}`}
                    >
                      <img
                        src={item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : noImage}
                        alt={item.title}
                        className={styles.recPoster}
                      />
                      <div className={styles.recTitle}>{item.title}</div>
                      <div className={styles.recRating}>★ {item.vote_average}</div>
                      <div className={styles.recSource}>
                        <span className={`${styles.swatchSmall} ${sourceColors[item.source]}`} />
                        <span className={styles.recSourceLabel}>{item.reasons[0]?.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {explanation && !loadingRecs && (
            <div className={styles.explainGrid}>
              {/* 3. What the engine had to work with, and what each source produced */}
              <div className={styles.panelDark}>
                <h3 className={styles.explainTitle}>Where this row comes from</h3>
                <p className={styles.explainSubtitle}>
                  Real share of the {explainedRecs.length} titles produced by each source
                </p>
                {explainedRecs.length > 0 && (
                  <ExplainabilityPieChart
                    mediaType={selectedMediaType}
                    composition={explanation.composition}
                    totalItems={explainedRecs.length}
                  />
                )}
                <div className={styles.signals}>
                  <div>Favorites: {explanation.signals.favoriteMoviesCount} movies, {explanation.signals.favoriteShowsCount} shows</div>
                  <div>Favorite genres: {explanation.signals.genreNames.join(', ') || 'none'}</div>
                  <div>Content-based seed: {explanation.signals.contentSeedTitle || 'none (no favorite of this type)'}</div>
                  <div>Excluded as already watched or rated: {explanation.signals.excludedCount}</div>
                  <div>
                    Candidates per source: watchlist {explanation.signals.poolSizes.watchlist}, content {explanation.signals.poolSizes.content},
                    collaborative {explanation.signals.poolSizes.collaborative}, genre {explanation.signals.poolSizes.genre}
                  </div>
                  {explanation.signals.isColdStart && (
                    <div className={styles.coldStartNotice}>
                      Cold start: no personal source returned a title, so the row is filled by fallbacks only.
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Why the selected title was recommended */}
              {selectedRecItem && (
                <div className={styles.panelDark}>
                  <div className={styles.whyHeader}>
                    <div>
                      <span className={styles.whyEyebrow}>
                        Why this {selectedMediaType === 'movie' ? 'movie' : 'show'}
                      </span>
                      <h3 className={styles.whyTitle}>{selectedRecItem.title}</h3>
                    </div>
                    <div className={styles.ratingPill}>★ {selectedRecItem.vote_average} / 10</div>
                  </div>
                  <div className={styles.reasonList}>
                    {selectedRecItem.reasons.map((reason, idx) => (
                      <div key={reason.source} className={styles.reason}>
                        <span className={`${styles.swatch} ${sourceColors[reason.source]}`} />
                        <div>
                          <div className={styles.reasonLabel}>
                            {reason.label}
                            <span className={styles.reasonRole}>
                              {idx === 0 ? ' (placed it in the row)' : ' (also suggested it)'}
                            </span>
                          </div>
                          <div className={styles.reasonDetail}>{reason.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
