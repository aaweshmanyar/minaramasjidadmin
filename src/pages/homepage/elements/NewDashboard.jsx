import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../component/Layout";
import {
  Plus,
  PenTool,
  Languages,
  BookOpen,
  FileText,
  UserCheck,
  MessageCircle
} from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API_BASE_URL from "../../../../config";

/* ---------- Theme accents to mirror the Minara HTML admin ---------- */
const tone = {
  writers: "text-emerald-600",
  translators: "text-cyan-600",
  books: "text-green-600",
  articles: "text-amber-600",
  feedback: "text-rose-600",
  admins: "text-violet-600"
};
const gradient = {
  writers: "from-emerald-50 to-white",
  translators: "from-cyan-50 to-white",
  books: "from-green-50 to-white",
  articles: "from-amber-50 to-white",
  feedback: "from-rose-50 to-white",
  admins: "from-violet-50 to-white"
};

/* For pretty numbers */
const n = (v) => (typeof v === "number" ? v.toLocaleString() : "0");

/* Safe extractor */
const pick = (obj, key, d = 0) =>
  obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] ?? d : d;

export default function NewDashboard() {
  const [counts, setCounts] = useState({
    writerCount: 0,
    translatorCount: 0,
    bookCount: 0,
    articleCount: 0,
    feedbackCount: 0,
    adminCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  /* Map actions for each tile */
  const routeMap = useMemo(
    () => ({
      writers: { add: "/createwriter", view: "/writers" },
      translators: { add: "/translator", view: "/translator" },
      books: { add: "/book", view: "/booklist" },
      articles: { add: "/article", view: "/viewarticle" },
      feedback: { view: "/feedback" }, // no "add" for feedback
      admins: { add: "/admin", view: "/admin" }
    }),
    []
  );

  /* Robust fetch: try combined endpoint first; if any field is missing, fall back to granular endpoints */
  useEffect(() => {
    const controller = new AbortController();
    const client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true,
      signal: controller.signal
    });

    async function fetchCounts() {
      setLoading(true);
      setErrMsg("");
      try {
        // 1) Try combined endpoint you used earlier
        //    Expecting something like:
        //    { writerCount, translatorCount, bookCount, articleCount, feedbackCount, adminCount }
        const combined = await client.get("/api/books/count").catch(() => null);
        const base = combined?.data || {};

        let next = {
          writerCount: pick(base, "writerCount"),
          translatorCount: pick(base, "translatorCount"),
          bookCount: pick(base, "bookCount"),
          articleCount: pick(base, "articleCount"),
          feedbackCount: pick(base, "feedbackCount"),
          adminCount: pick(base, "adminCount")
        };

        // 2) If any are missing/zero and you want stricter correctness, try granular endpoints.
        //    These fallbacks are common patterns; adjust paths if your API differs.
        const needs = {
          writers: next.writerCount === 0,
          translators: next.translatorCount === 0,
          books: next.bookCount === 0,
          articles: next.articleCount === 0,
          feedback: next.feedbackCount === 0,
          admins: next.adminCount === 0
        };

        const reqs = [];
        if (needs.writers) reqs.push(client.get("/api/writers/count").catch(() => null));
        if (needs.translators) reqs.push(client.get("/api/translators/count").catch(() => null));
        if (needs.books) reqs.push(client.get("/api/books/count-only").catch(() => null));
        if (needs.articles) reqs.push(client.get("/api/articles/count").catch(() => null));
        if (needs.feedback) reqs.push(client.get("/api/feedback/count").catch(() => null));
        if (needs.admins) reqs.push(client.get("/api/admin/count").catch(() => null));

        if (reqs.length) {
          const resArr = await Promise.all(reqs);
          // Map results back by checking URL suffix (cheap and avoids extra state)
          resArr.forEach((res) => {
            if (!res || !res.config || !res.config.url) return;
            const url = res.config.url;

            // normalize the numbers in common shapes
            const d = res.data || {};
            const val =
              typeof d.count === "number"
                ? d.count
                : typeof d.total === "number"
                ? d.total
                : Object.values(d).find((x) => typeof x === "number") || 0;

            if (url.endsWith("/api/writers/count")) next.writerCount = val;
            if (url.endsWith("/api/translators/count")) next.translatorCount = val;
            if (url.endsWith("/api/books/count-only")) next.bookCount = val;
            if (url.endsWith("/api/articles/count")) next.articleCount = val;
            if (url.endsWith("/api/feedback/count")) next.feedbackCount = val;
            if (url.endsWith("/api/admin/count")) next.adminCount = val;
          });
        }

        setCounts(next);
      } catch (e) {
        console.error("Dashboard counts error:", e);
        setErrMsg("Some stats couldn’t be loaded. Showing what we have.");
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
    return () => controller.abort();
  }, []);

  /* Card data */
  const stats = [
    {
      key: "writers",
      title: "Writers",
      count: counts.writerCount,
      icon: PenTool,
      desc: "Active contributors & scholars"
    },
    {
      key: "translators",
      title: "Translators",
      count: counts.translatorCount,
      icon: Languages,
      desc: "Language experts in the system"
    },
    {
      key: "books",
      title: "Books",
      count: counts.bookCount,
      icon: BookOpen,
      desc: "Cataloged books available"
    },
    {
      key: "articles",
      title: "Articles",
      count: counts.articleCount,
      icon: FileText,
      desc: "Published & draft articles"
    },
    {
      key: "feedback",
      title: "Feedback Form",
      count: counts.feedbackCount,
      icon: MessageCircle,
      desc: "User feedback & messages"
    },
    {
      key: "admins",
      title: "Admins",
      count: counts.adminCount,
      icon: UserCheck,
      desc: "Admin & moderator accounts"
    }
  ];

  /* Skeleton card */
  const Skeleton = () => (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-28 bg-gray-200 rounded" />
        <div className="h-9 w-9 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-9 w-24 bg-gray-200 rounded mb-3" />
      <div className="h-4 w-28 bg-gray-200 rounded" />
      <div className="mt-5 flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded" />
        <div className="h-9 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Title + quick actions */}
        <div className="px-4 md:px-6 lg:px-8 pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-sm text-gray-600 mt-1">
                Snapshot of your content, team, and activity.
              </p>
            </div>
            {/* <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate("/article")}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm shadow-md"
              >
                <Plus className="w-4 h-4" />
                New Article
              </button>
              <button
                onClick={() => navigate("/book")}
                className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                New Book
              </button>
            </div> */}
          </div>

          {/* Error banner (non-blocking) */}
          {errMsg ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-2 text-sm">
              {errMsg}
            </div>
          ) : null}

          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)
              : stats.map((stat, index) => {
                  const Icon = stat.icon;
                  const t = tone[stat.key];
                  const g = gradient[stat.key];
                  const routes = routeMap[stat.key] || {};
                  const hasAdd = Boolean(routes.add);

                  return (
                    <motion.div
                      key={stat.key}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className={`relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-gradient-to-br ${g}`}
                    >
                      {/* soft corner glow like HTML theme */}
                      <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-emerald-100 blur-2xl opacity-50 pointer-events-none" />

                      <div className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-100 ${t}`}
                              >
                                <Icon className="w-5 h-5" />
                              </span>
                              <h4 className="text-sm font-semibold text-gray-700">
                                {stat.title}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-500">{stat.desc}</p>
                          </div>

                          <div className="text-right">
                            <div className="text-3xl font-extrabold tracking-tight text-gray-900">
                              {n(stat.count)}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">total</div>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                          {hasAdd && (
                            <button
                              onClick={() => navigate(routes.add)}
                              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-xs shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          )}
                          {routes.view && (
                            <button
                              onClick={() => navigate(routes.view)}
                              className="inline-flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs"
                            >
                              View all
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
          </div>

          {/* compact insights row */}
          {/* {!loading && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Content Mix</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {n(counts.articleCount)} articles, {n(counts.bookCount)} books.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Team</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {n(counts.writerCount)} writers, {n(counts.translatorCount)} translators,{" "}
                  {n(counts.adminCount)} admins.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700">Engagement</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {n(counts.feedbackCount)} feedback entries received.
                </p>
              </div>
            </div>
          )} */}

          <div className="h-8" />
        </div>
      </div>
    </Layout>
  );
}
