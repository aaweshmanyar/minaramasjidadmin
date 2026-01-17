import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Book, FileText, Globe, Users } from "lucide-react";
import axios from "axios";
import Layout from "../../../component/Layout";
import API_BASE_URL from "../../../../config";


export default function DashboardOverview() {
  const [counts, setCounts] = useState({
    writerCount: 0,
    translatorCount: 0,
    bookCount: 0,
    unicodeBookCount: 0,
    adminCount: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/books/count`)
      .then((res) => {
        setCounts({
          writerCount: res.data.writerCount || 0,
          translatorCount: res.data.translatorCount || 0,
          bookCount: res.data.bookCount || 0,
          unicodeBookCount: res.data.unicodeBookCount || 0,
          adminCount: res.data.adminCount || 0,
        });
      })
      .catch((err) => {
        console.error("Error fetching dashboard counts:", err);
      });
  }, []);

  const dashboardItems = [
    {
      title: "Writers",
      count: counts.writerCount,
      icon: FileText,
      buttonText: "Add Writer",
      buttonHref: "/createwriter",
      colorScheme: {
        bgLight: "bg-amber-100",
        bgDark: "bg-amber-500",
        hoverBg: "hover:bg-amber-600",
      },
      colSpan: "col-span-1",
    },
    {
      title: "Translators",
      count: counts.translatorCount,
      icon: Globe,
      buttonText: "Add Translator",
      buttonHref: "/translator",
      colorScheme: {
        bgLight: "bg-blue-100",
        bgDark: "bg-blue-500",
        hoverBg: "hover:bg-blue-600",
      },
      colSpan: "col-span-1",
    },
    {
      title: "Books",
      count: counts.bookCount,
      icon: Book,
      buttonText: "Add Book",
      buttonHref: "/book",
      colorScheme: {
        bgLight: "bg-emerald-100",
        bgDark: "bg-emerald-500",
        hoverBg: "hover:bg-emerald-600",
      },
      colSpan: "col-span-1",
    },
    {
      title: "Unicode Books",
      count: counts.unicodeBookCount,
      icon: Book,
      buttonText: "Add Unicode Book",
      buttonHref: "/unicodebook",
      colorScheme: {
        bgLight: "bg-red-100",
        bgDark: "bg-red-500",
        hoverBg: "hover:bg-red-600",
      },
      colSpan: "col-span-1",
    },
    {
      title: "Admin",
      count: counts.adminCount,
      icon: Users,
      buttonText: "Add Admin",
      buttonHref: "/admin",
      colorScheme: {
        bgLight: "bg-slate-100",
        bgDark: "bg-slate-700",
        hoverBg: "hover:bg-slate-800",
      },
      colSpan: "md:col-span-2 lg:col-span-1",
    },
  ];

  const DashboardCard = ({ title, count, icon: Icon, buttonText, buttonHref, colorScheme }) => (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-md ${colorScheme.bgLight}`}>
            <Icon className={`h-6 w-6 ${colorScheme.bgDark}`} />
          </div>
          <span className="text-lg text-gray-600">{title}</span>
        </div>
        <span className="text-4xl font-bold text-gray-900">{count}</span>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => navigate(buttonHref)}
          className={`rounded-md px-4 py-2 text-white ${colorScheme.bgDark} ${colorScheme.hoverBg} transition-colors`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {dashboardItems.map((item, index) => (
            <div key={index} className={item.colSpan}>
              <DashboardCard
                title={item.title}
                count={item.count}
                icon={item.icon}
                buttonText={item.buttonText}
                buttonHref={item.buttonHref}
                colorScheme={item.colorScheme}
              />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
