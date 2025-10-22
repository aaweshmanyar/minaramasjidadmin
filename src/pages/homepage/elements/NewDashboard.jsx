import React, { useEffect, useState } from 'react';
import Layout from '../../../component/Layout';
import { Plus, PenTool, Languages, BookOpen, FileText, UserCheck, MessageCircle } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import API_BASE_URL from '../../../../config';

const NewDashboard = () => {
    const [counts, setCounts] = useState({
        writerCount: 0,
        translatorCount: 0,
        bookCount: 0,
        unicodeBookCount: 0,
        adminCount: 0,
    });

    const navigate = useNavigate();

    const routeMap = {
        Writers: { add: "/createwriter", view: "/writers" },
        Translators: { add: "/translator", view: "/translator" },
        Books: { add: "/book", view: "/booklist" },
        Articles: { add: "/article", view: "/viewarticle" },
        Feedbacks: { view: "/feedback" },
        Admins: { add: "/admin", view: "/admin" },
    };

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/books/count`)
            .then((res) => {
                setCounts({
                    writerCount: res.data.writerCount || 0,
                    translatorCount: res.data.translatorCount || 0,
                    bookCount: res.data.bookCount || 0,
                    articleCount: res.data.articleCount || 0,
                    feedbackCount: res.data.feedbackCount || 0,
                    adminCount: res.data.adminCount || 0,
                });
            })
            .catch((err) => {
                console.error("Error fetching dashboard counts:", err);
            });
    }, []);

    const stats = [
        {
            title: "Writers",
            count: counts.writerCount,
            icon: PenTool,
            iconColor: "text-amber-500",
        },
        {
            title: "Translators",
            count: counts.translatorCount,
            icon: Languages,
            iconColor: "text-blue-500",
        },
        {
            title: "Books",
            count: counts.bookCount,
            icon: BookOpen,
            iconColor: "text-emerald-500",
        },
        {
            title: "Articles",
            count: counts.articleCount,
            icon: FileText,
            iconColor: "text-red-500",
        },
        {
            title: "Feedback Form",
            count: counts.feedbackCount,
            icon: MessageCircle,
            iconColor: "text-red-500",
        },
        {
            title: "Admins",
            count: counts.adminCount,
            icon: UserCheck,
            iconColor: "text-violet-500",
        },
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stats.map((stat, index) => {
                            const Icon = stat.icon;
                            const routes = routeMap[stat.title];

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 hover:shadow-lg transition duration-200"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                                            <h4 className="text-sm font-semibold text-gray-600">{stat.title}</h4>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-3xl font-bold text-gray-900">{stat.count}</span>
                                        <button
                                            onClick={() => navigate(routes.add)}
                                            className="flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] rounded-md"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => navigate(routes.view)}
                                        className="text-sm text-gray-500 hover:underline"
                                    >
                                        View all
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default NewDashboard;
