import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FolderGit2,
  BookOpen,
  Layers,
  Plus,
  Search,
  X,
  RefreshCw,
  Table as TableIcon,
  LayoutGrid,
  Filter,
} from "lucide-react";
import useTaxonomy from "../../../shared/hooks/useTaxonomy";
import useAuthState from "../../auth/utils/useAuthState";
import CategoriesTable from "./taxonomy/CategoriesTable";
import SubjectsTable from "./taxonomy/SubjectsTable";
import TopicsTable from "./taxonomy/TopicsTable";
import { TenantSelect } from "./TenantControls";
import {
  CategoryCards,
  SubjectCards,
  TopicCards,
} from "./taxonomy/TaxonomyCards";
import CreateCategoryModal from "./taxonomy/CreateCategoryModal";
import CreateSubjectModal from "./taxonomy/CreateSubjectModal";
import CreateTopicModal from "./taxonomy/CreateTopicModal";
import { SUPER_ADMIN_DASHBOARD } from "../../../app/roleRoutes";
import "../styles/super-admin-dashboard.css";
import BrandLoader from "../../../shared/components/ui/BrandLoader";

const TABS = [
  { id: "categories", label: "Exam Categories", icon: FolderGit2 },
  { id: "subjects", label: "Subjects", icon: BookOpen },
  { id: "topics", label: "Topics", icon: Layers },
];

export default function TaxonomySection({ initialTab, taxonomyBasePath = `${SUPER_ADMIN_DASHBOARD}/taxonomy`, showCategories = true }) {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthState();

  // Active tab state (synced with route /taxonomy/categories | subjects | topics)
  const activeTab = useMemo(() => {
    const rawTab = tab || initialTab || "categories";
    if ((showCategories || rawTab !== "categories") && ["categories", "subjects", "topics"].includes(rawTab)) {
      return rawTab;
    }
    return showCategories ? "categories" : "subjects";
  }, [tab, initialTab, showCategories]);

  const handleTabChange = (newTab) => {
    navigate(`${taxonomyBasePath}/${newTab}`);
  };

  const {
    categories,
    categoriesStatus,
    categoriesError,
    addCategory,
    fetchCategories,

    subjects,
    subjectsStatus,
    subjectsError,
    selectedCategoryId,
    setSelectedCategoryId,
    fetchSubjects,
    addSubject,

    topics,
    topicsStatus,
    topicsError,
    selectedSubjectId,
    setSelectedSubjectId,
    fetchTopics,
    addTopic,

    refreshAll,
  } = useTaxonomy();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState("ALL");
  const [categoryFilterId, setCategoryFilterId] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);

  // Clear search on tab switch
  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshAll();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filtered lists
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    const q = searchQuery.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch = !q ||
        category.category_name.toLowerCase().includes(q) ||
        category.category_code.toLowerCase().includes(q) ||
        (category.description && category.description.toLowerCase().includes(q));
      const matchesStatus = categoryStatusFilter === "ALL" ||
        (categoryStatusFilter === "ACTIVE" ? category.is_active : !category.is_active);
      const matchesCategory = categoryFilterId === "ALL" || String(category.category_id) === categoryFilterId;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categories, searchQuery, categoryStatusFilter, categoryFilterId]);

  const hasActiveFilters = Boolean(searchQuery.trim()) ||
    (activeTab === "categories" && (categoryStatusFilter !== "ALL" || categoryFilterId !== "ALL")) ||
    (activeTab === "subjects" && selectedCategoryId !== "ALL") ||
    (activeTab === "topics" && selectedSubjectId !== "ALL");

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryStatusFilter("ALL");
    setCategoryFilterId("ALL");
    setSelectedCategoryId("ALL");
    setSelectedSubjectId("ALL");
    fetchSubjects("ALL");
    fetchTopics("ALL");
  };

  const filteredSubjects = useMemo(() => {
    if (!subjects) return [];
    let list = subjects;
    if (selectedCategoryId !== "ALL") {
      list = list.filter((s) => s.category_id === selectedCategoryId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (s) =>
        s.subject_name.toLowerCase().includes(q) ||
        (s.subject_code && s.subject_code.toLowerCase().includes(q)) ||
        (s.category_name && s.category_name.toLowerCase().includes(q))
    );
  }, [subjects, selectedCategoryId, searchQuery]);

  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    let list = topics;
    if (selectedSubjectId !== "ALL") {
      list = list.filter((t) => t.subject_id === selectedSubjectId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.topic_name.toLowerCase().includes(q) ||
        (t.subject_name && t.subject_name.toLowerCase().includes(q)) ||
        (t.category_name && t.category_name.toLowerCase().includes(q))
    );
  }, [topics, selectedSubjectId, searchQuery]);

  // Role permissions check
  const userRole = (user?.role || user?.default_role || "").toUpperCase();
  const canCreateCategory = userRole === "SUPER_ADMIN";
  const canCreateSubjectOrTopic = ["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(
    userRole
  );
  const visibleTabs = showCategories ? TABS : TABS.filter((item) => item.id !== "categories");

  return (
    <div className={`sa-taxonomy-section${showCategories ? "" : " sa-taxonomy-section--organization"}`}>
      {/* Top Stat Highlights */}
      <section className="sa-tenants-stats-bar" aria-label="Taxonomy metrics">
        {showCategories && <button
          type="button"
          className={`sa-tenant-stat-card ${activeTab === "categories" ? "is-selected-card" : ""}`}
          onClick={() => handleTabChange("categories")}
          aria-current={activeTab === "categories" ? "page" : undefined}
        >
          <div className="sa-tstat-icon is-teal">
            <FolderGit2 size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-copy">
            <span className="sa-tstat-label">Exam Categories</span>
            <strong className="sa-tstat-value">
              {categoriesStatus === "ready" ? categories.length : "—"}
            </strong>
            <span className="sa-tstat-meta">Platform Master</span>
          </div>
        </button>}

        <button
          type="button"
          className={`sa-tenant-stat-card ${activeTab === "subjects" ? "is-selected-card" : ""}`}
          onClick={() => handleTabChange("subjects")}
          aria-current={activeTab === "subjects" ? "page" : undefined}
        >
          <div className="sa-tstat-icon is-navy">
            <BookOpen size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-copy">
            <span className="sa-tstat-label">Curriculum Subjects</span>
            <strong className="sa-tstat-value">
              {subjectsStatus === "ready" ? subjects.length : "—"}
            </strong>
            <span className="sa-tstat-meta">Active Subjects</span>
          </div>
        </button>

        <button
          type="button"
          className={`sa-tenant-stat-card ${activeTab === "topics" ? "is-selected-card" : ""}`}
          onClick={() => handleTabChange("topics")}
          aria-current={activeTab === "topics" ? "page" : undefined}
        >
          <div className="sa-tstat-icon is-amber">
            <Layers size={20} aria-hidden="true" />
          </div>
          <div className="sa-tstat-copy">
            <span className="sa-tstat-label">Syllabus Topics</span>
            <strong className="sa-tstat-value">
              {topicsStatus === "ready" ? topics.length : "—"}
            </strong>
            <span className="sa-tstat-meta">Chapters & Topics</span>
          </div>
        </button>
      </section>

      {/* Main Panel */}
      <div className="sa-content-panel sa-taxonomy-panel">
        {/* Navigation Tabs Header */}
        <div className="sa-taxonomy-tabs-header">
          <nav className="sa-taxonomy-tabs" aria-label="Taxonomy tabs">
            {visibleTabs.map((tabItem) => {
              const TabIcon = tabItem.icon;
              const isActive = activeTab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  className={`sa-tax-tab-btn ${isActive ? "is-active" : ""}`}
                  onClick={() => handleTabChange(tabItem.id)}
                  aria-selected={isActive}
                  role="tab"
                >
                  <TabIcon size={16} aria-hidden="true" />
                  <span>{tabItem.label}</span>
                  <span className="sa-tax-tab-badge">
                    {tabItem.id === "categories"
                      ? categories.length
                      : tabItem.id === "subjects"
                        ? subjects.length
                        : topics.length}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Action Button for current tab */}
          <div className="sa-taxonomy-header-actions">
            {activeTab === "categories" && canCreateCategory && (
              <button
                type="button"
                className="sa-btn sa-btn--primary"
                onClick={() => setIsCreateCategoryOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add Category</span>
              </button>
            )}

            {activeTab === "subjects" && canCreateSubjectOrTopic && (
              <button
                type="button"
                className="sa-btn sa-btn--primary"
                onClick={() => setIsCreateSubjectOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add Subject</span>
              </button>
            )}

            {activeTab === "topics" && canCreateSubjectOrTopic && (
              <button
                type="button"
                className="sa-btn sa-btn--primary"
                onClick={() => setIsCreateTopicOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>Add Topic</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="sa-tenants-toolbar">
          <div className="sa-toolbar-left">
            {/* Search */}
            <div className="sa-search-wrap">
              <Search size={16} className="sa-search-icon" aria-hidden="true" />
              <input
                type="text"
                inputMode="search"
                className="sa-search-input"
                placeholder={
                  activeTab === "categories"
                    ? "Search categories by name, code..."
                    : activeTab === "subjects"
                      ? "Search subjects by name, code..."
                      : "Search topics..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search taxonomy"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="sa-search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            {activeTab === "categories" && (
              <div className="sa-filter-group">
                <Filter size={14} className="sa-filter-icon" aria-hidden="true" />
                <TenantSelect
                  value={categoryFilterId}
                  options={[{ value: "ALL", label: "All categories" }, ...categories.map((category) => ({ value: String(category.category_id), label: category.category_name }))]}
                  onChange={setCategoryFilterId}
                  label="Filter by category"
                  compact
                />
              </div>
            )}

            {activeTab === "categories" && (
              <div className="sa-filter-group">
                <Filter size={14} className="sa-filter-icon" aria-hidden="true" />
                <TenantSelect
                  value={categoryStatusFilter}
                  options={[
                    { value: "ALL", label: "All statuses" },
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                  onChange={setCategoryStatusFilter}
                  label="Filter categories by status"
                  compact
                />
              </div>
            )}

            {/* Parent Category Filter for Subjects */}
            {activeTab === "subjects" && (
              <div className="sa-filter-group">
                <Filter size={14} className="sa-filter-icon" aria-hidden="true" />
                <TenantSelect
                  value={selectedCategoryId}
                  options={[{ value: "ALL", label: "All categories" }, ...categories.map((category) => ({ value: String(category.category_id), label: category.category_name }))]}
                  onChange={(categoryId) => {
                    setSelectedCategoryId(categoryId);
                    fetchSubjects(categoryId);
                  }}
                  label="Filter subjects by category"
                  compact
                />
              </div>
            )}

            {/* Parent Subject Filter for Topics */}
            {activeTab === "topics" && (
              <div className="sa-filter-group">
                <Filter size={14} className="sa-filter-icon" aria-hidden="true" />
                <TenantSelect
                  value={selectedSubjectId}
                  options={[{ value: "ALL", label: "All subjects" }, ...subjects.map((subject) => ({ value: String(subject.subject_id), label: subject.subject_name }))]}
                  onChange={(subjectId) => {
                    setSelectedSubjectId(subjectId);
                    fetchTopics(subjectId);
                  }}
                  label="Filter topics by subject"
                  compact
                />
              </div>
            )}
          </div>

          <div className="sa-toolbar-right">
            {hasActiveFilters && (
              <button type="button" className="sa-tax-clear-filters" onClick={clearFilters}>
                <X size={15} aria-hidden="true" />
                <span>Clear filters</span>
              </button>
            )}
            {/* Refresh */}
            <button
              type="button"
              className="sa-icon-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
              />
            </button>

            {/* View Mode Toggle */}
            <div className="sa-view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={`sa-view-btn ${viewMode === "table" ? "is-active" : ""}`}
                onClick={() => setViewMode("table")}
                title="Table view"
                aria-label="Table view"
                aria-pressed={viewMode === "table"}
              >
                <TableIcon size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`sa-view-btn ${viewMode === "cards" ? "is-active" : ""}`}
                onClick={() => setViewMode("cards")}
                title="Grid view"
                aria-label="Grid view"
                aria-pressed={viewMode === "cards"}
              >
                <LayoutGrid size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="sa-tax-tab-content">
          {activeTab === "categories" && (
            <>
              {categoriesStatus === "error" && (
                <div className="sa-tax-load-error" role="alert">
                  <span>{categoriesError || "Unable to load categories."}</span>
                  <button type="button" onClick={fetchCategories}>Try again</button>
                </div>
              )}
              {categoriesStatus === "loading" && categories.length === 0 ? (
                <BrandLoader variant="section" message="Loading categories…" />
              ) : (
                <>
                  {categoriesStatus === "loading" && <BrandLoader variant="section" className="ve-brand-loader--compact" message="Refreshing categories…" />}
                  {viewMode === "table" ? (
                    <CategoriesTable categories={filteredCategories} />
                  ) : (
                    <CategoryCards categories={filteredCategories} />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "subjects" && (
            <>
              {subjectsStatus === "error" && (
                <div className="sa-tax-load-error" role="alert">
                  <span>{subjectsError || "Unable to load subjects."}</span>
                  <button type="button" onClick={() => fetchSubjects(selectedCategoryId)}>Try again</button>
                </div>
              )}
              {subjectsStatus === "loading" && subjects.length === 0 ? (
                <BrandLoader variant="section" message="Loading subjects…" />
              ) : (
                <>
                  {subjectsStatus === "loading" && <BrandLoader variant="section" className="ve-brand-loader--compact" message="Refreshing subjects…" />}
                  {viewMode === "table" ? (
                    <SubjectsTable subjects={filteredSubjects} />
                  ) : (
                    <SubjectCards subjects={filteredSubjects} />
                  )}
                </>
              )}
            </>
          )}

          {activeTab === "topics" && (
            <>
              {topicsStatus === "error" && (
                <div className="sa-tax-load-error" role="alert">
                  <span>{topicsError || "Unable to load topics."}</span>
                  <button type="button" onClick={() => fetchTopics(selectedSubjectId)}>Try again</button>
                </div>
              )}
              {topicsStatus === "loading" && topics.length === 0 ? (
                <BrandLoader variant="section" message="Loading topics…" />
              ) : (
                <>
                  {topicsStatus === "loading" && <BrandLoader variant="section" className="ve-brand-loader--compact" message="Refreshing topics…" />}
                  {viewMode === "table" ? (
                    <TopicsTable topics={filteredTopics} />
                  ) : (
                    <TopicCards topics={filteredTopics} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Creation Modals */}
      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onSubmit={addCategory}
      />

      <CreateSubjectModal
        isOpen={isCreateSubjectOpen}
        onClose={() => setIsCreateSubjectOpen(false)}
        categories={categories}
        initialCategoryId={selectedCategoryId}
        onSubmit={addSubject}
      />

      <CreateTopicModal
        isOpen={isCreateTopicOpen}
        onClose={() => setIsCreateTopicOpen(false)}
        subjects={subjects}
        initialSubjectId={selectedSubjectId}
        onSubmit={addTopic}
      />
    </div>
  );
}
