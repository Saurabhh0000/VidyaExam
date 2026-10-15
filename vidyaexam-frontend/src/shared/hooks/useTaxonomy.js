import { useState, useEffect, useCallback, useRef } from "react";
import {
  getCategories,
  createCategory as apiCreateCategory,
  getSubjects,
  createSubject as apiCreateSubject,
  getTopics,
  createTopic as apiCreateTopic,
} from "../services/taxonomy.service";

export default function useTaxonomy({ autoFetch = true } = {}) {
  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoriesStatus, setCategoriesStatus] = useState("idle"); // idle | loading | ready | error
  const [categoriesError, setCategoriesError] = useState(null);

  // Subjects State
  const [subjects, setSubjects] = useState([]);
  const [subjectsStatus, setSubjectsStatus] = useState("idle");
  const [subjectsError, setSubjectsError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");

  // Topics State
  const [topics, setTopics] = useState([]);
  const [topicsStatus, setTopicsStatus] = useState("idle");
  const [topicsError, setTopicsError] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("ALL");

  const abortControllers = useRef({
    categories: null,
    subjects: null,
    topics: null,
  });

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    if (abortControllers.current.categories) {
      abortControllers.current.categories.abort();
    }
    const controller = new AbortController();
    abortControllers.current.categories = controller;

    setCategoriesStatus("loading");
    setCategoriesError(null);
    try {
      const res = await getCategories({ signal: controller.signal });
      setCategories(res.data || []);
      setCategoriesStatus("ready");
      return res.data;
    } catch (err) {
      if (err?.name !== "CanceledError") {
        setCategoriesStatus("error");
        setCategoriesError(err.message || "Failed to load categories");
      }
      return null;
    }
  }, []);

  // Fetch Subjects
  const fetchSubjects = useCallback(async (catId = selectedCategoryId) => {
    if (abortControllers.current.subjects) {
      abortControllers.current.subjects.abort();
    }
    const controller = new AbortController();
    abortControllers.current.subjects = controller;

    setSubjectsStatus("loading");
    setSubjectsError(null);
    try {
      const res = await getSubjects({
        categoryId: catId === "ALL" ? undefined : catId,
        signal: controller.signal,
      });
      setSubjects(res.data || []);
      setSubjectsStatus("ready");
      return res.data;
    } catch (err) {
      if (err?.name !== "CanceledError") {
        setSubjectsStatus("error");
        setSubjectsError(err.message || "Failed to load subjects");
      }
      return null;
    }
  }, [selectedCategoryId]);

  // Fetch Topics
  const fetchTopics = useCallback(async (subjId = selectedSubjectId) => {
    if (abortControllers.current.topics) {
      abortControllers.current.topics.abort();
    }
    const controller = new AbortController();
    abortControllers.current.topics = controller;

    setTopicsStatus("loading");
    setTopicsError(null);
    try {
      const res = await getTopics({
        subjectId: subjId === "ALL" ? undefined : subjId,
        signal: controller.signal,
      });
      setTopics(res.data || []);
      setTopicsStatus("ready");
      return res.data;
    } catch (err) {
      if (err?.name !== "CanceledError") {
        setTopicsStatus("error");
        setTopicsError(err.message || "Failed to load topics");
      }
      return null;
    }
  }, [selectedSubjectId]);

  // Initial Fetch
  useEffect(() => {
    if (!autoFetch) return;
    fetchCategories();
    fetchSubjects("ALL");
    fetchTopics("ALL");

    return () => {
      Object.values(abortControllers.current).forEach((c) => c?.abort());
    };
  }, [autoFetch, fetchCategories, fetchSubjects, fetchTopics]);

  // Create Handlers
  const addCategory = async (payload) => {
    const res = await apiCreateCategory(payload);
    // Refresh categories
    await fetchCategories();
    return res;
  };

  const addSubject = async (payload) => {
    const res = await apiCreateSubject(payload);
    // Refresh subjects
    await fetchSubjects(selectedCategoryId);
    return res;
  };

  const addTopic = async (payload) => {
    const res = await apiCreateTopic(payload);
    // Refresh topics
    await fetchTopics(selectedSubjectId);
    return res;
  };

  return {
    categories,
    categoriesStatus,
    categoriesError,
    fetchCategories,
    addCategory,

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

    refreshAll: () => {
      fetchCategories();
      fetchSubjects(selectedCategoryId);
      fetchTopics(selectedSubjectId);
    },
  };
}
