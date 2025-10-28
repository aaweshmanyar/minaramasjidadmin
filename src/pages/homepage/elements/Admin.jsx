import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import firebaseConfig from "../../firebase/firebaseConfig";
import {
  UserPlus,
  Pencil,
  Eye,
  Trash2,
  Search,
  Shield,
  Mail,
  User,
  CalendarClock,
  AtSign,
} from "lucide-react";

/* ---------- Firebase boot ---------- */
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

export default function AdminList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [viewAdmin, setViewAdmin] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  });

  /* ---------- Effects ---------- */
  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (editingAdmin) {
      setFormData({
        fname: editingAdmin.fname || "",
        lname: editingAdmin.lname || "",
        email: editingAdmin.email || "",
        password: "",
        confirmPassword: "",
        role: editingAdmin.role || "admin",
      });
    }
  }, [editingAdmin]);

  /* ---------- Data ---------- */
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const snapshot = await db.collection("admins").where("deleted", "!=", true).get();
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdOn: data.createdOn?.toDate?.() || null,
          modifiedOn: data.modifiedOn?.toDate?.() || null,
        };
      });
      setAdmins(list);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      Swal.fire("Error", "Failed to fetch admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Derived ---------- */
  const filtered = useMemo(() => {
    return admins
      .filter((a) =>
        roleFilter === "all" ? true : String(a.role || "").toLowerCase() === roleFilter
      )
      .filter((a) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const name = `${a.fname || ""} ${a.lname || ""}`.toLowerCase();
        const email = (a.email || "").toLowerCase();
        const role = (a.role || "").toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q);
      })
      .sort((a, b) => {
        const ma = a.modifiedOn ? a.modifiedOn.getTime() : 0;
        const mb = b.modifiedOn ? b.modifiedOn.getTime() : 0;
        return mb - ma;
      });
  }, [admins, search, roleFilter]);

  /* ---------- Helpers ---------- */
  const resetForm = () => {
    setFormData({
      fname: "",
      lname: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
    });
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };
  const validateForm = () => {
    if (!formData.fname || !formData.lname || !formData.email || !formData.role) {
      Swal.fire("Validation Error", "All fields are required", "warning");
      return false;
    }
    if (!["admin", "superadmin"].includes(formData.role)) {
      Swal.fire("Validation Error", "Role must be 'admin' or 'superadmin'", "warning");
      return false;
    }
    if (!editingAdmin && (!formData.password || !formData.confirmPassword)) {
      Swal.fire("Validation Error", "Password fields are required for new admin", "warning");
      return false;
    }
    if (formData.password && formData.password.length < 6) {
      Swal.fire("Validation Error", "Password must be at least 6 characters.", "warning");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Swal.fire("Validation Error", "Passwords do not match.", "warning");
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    if (!emailOk) {
      Swal.fire("Validation Error", "Please enter a valid email address.", "warning");
      return false;
    }
    return true;
  };
  const initials = (f = "", l = "") =>
    `${(f || "").charAt(0)}${(l || "").charAt(0)}`.toUpperCase() || "A";

  /* ---------- CRUD ---------- */
  const handleAddAdminClick = () => {
    setEditingAdmin(null);
    resetForm();
    setShowForm(true);
  };
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    try {
      const cred = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
      const uid = cred.user.uid;
      const { confirmPassword, password, ...data } = formData;
      const payload = {
        ...data,
        uid,
        createdOn: firebase.firestore.FieldValue.serverTimestamp(),
        modifiedOn: firebase.firestore.FieldValue.serverTimestamp(),
        deleted: false,
      };
      await db.collection("admins").doc(uid).set(payload);
      Swal.fire("Success", "Admin created successfully!", "success");
      await fetchAdmins();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error("Error adding admin:", error);
      let msg = "Failed to create admin";
      if (error.code === "auth/email-already-in-use") msg = "Email already in use";
      if (error.code === "auth/invalid-email") msg = "Invalid email address";
      if (error.code === "auth/weak-password") msg = "Password is too weak";
      Swal.fire("Error", msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleEditAdmin = async (id) => {
    try {
      const doc = await db.collection("admins").doc(id).get();
      if (!doc.exists) {
        Swal.fire("Error", "Admin not found", "error");
        return;
      }
      setEditingAdmin({ id: doc.id, ...doc.data() });
      setShowForm(true);
    } catch (err) {
      console.error("Error fetching admin:", err);
      Swal.fire("Error", "Failed to fetch admin details", "error");
    }
  };
  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    try {
      const { confirmPassword, password, ...data } = formData;
      const payload = {
        ...data,
        modifiedOn: firebase.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("admins").doc(editingAdmin.id).update(payload);
      if (password) {
        Swal.fire(
          "Info",
          "To change password, please use the password reset feature after logging out.",
          "info"
        );
      }
      Swal.fire("Success", "Admin updated successfully!", "success");
      await fetchAdmins();
      setShowForm(false);
      setEditingAdmin(null);
      resetForm();
    } catch (error) {
      console.error("Error updating admin:", error);
      let msg = "Failed to update admin";
      if (error.code === "auth/requires-recent-login") {
        msg = "Please logout and login again to change sensitive information.";
      }
      Swal.fire("Error", msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async (id) => {
    if (id === auth.currentUser?.uid) {
      Swal.fire("Error", "You cannot delete your own account", "error");
      return;
    }
    const confirm = await Swal.fire({
      title: "Delete this admin?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, delete it!",
    });
    if (!confirm.isConfirmed) return;

    try {
      await db.collection("admins").doc(id).delete();
      Swal.fire("Deleted!", "Admin has been permanently deleted.", "success");
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      Swal.fire("Error", "Failed to delete admin", "error");
    }
  };
  const handleViewAdmin = async (id) => {
    try {
      const doc = await db.collection("admins").doc(id).get();
      if (!doc.exists) {
        Swal.fire("Error", "Admin not found", "error");
        return;
      }
      const d = doc.data();
      setViewAdmin({
        id: doc.id,
        ...d,
        createdOn: d.createdOn?.toDate?.() || null,
        modifiedOn: d.modifiedOn?.toDate?.() || null,
      });
      setViewModalOpen(true);
    } catch (err) {
      console.error("Error fetching admin details:", err);
      Swal.fire("Error", "Failed to fetch admin details.", "error");
    }
  };

  /* ---------- UI bits ---------- */
  const RoleBadge = ({ role }) => {
    const isSuper = String(role || "").toLowerCase() === "superadmin";
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isSuper
            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}
      >
        <Shield className={`w-3.5 h-3.5 ${isSuper ? "text-indigo-600" : "text-emerald-600"}`} />
        {isSuper ? "Super Admin" : "Admin"}
      </span>
    );
  };

  const StatPills = (
    <div className="flex flex-wrap gap-2">
      <span className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
        Total: {admins.length}
      </span>
      <span className="px-3 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
        Super Admins: {admins.filter((a) => (a.role || "").toLowerCase() === "superadmin").length}
      </span>
      <span className="px-3 py-1 rounded-full text-xs bg-slate-50 text-slate-700 border border-slate-200">
        Admins: {admins.filter((a) => (a.role || "").toLowerCase() === "admin").length}
      </span>
    </div>
  );

  const Toolbar = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        {StatPills}
        <button
          onClick={handleAddAdminClick}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Admin
        </button>
      </div>
    </div>
  );

  const Table = (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-auto">
        <table className="min-w-[900px] w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left text-gray-700">
              <th className="px-4 py-3 text-[13px] font-semibold">Name</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Email</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Role</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Created On</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Modified On</th>
              <th className="px-4 py-3 text-[13px] font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((admin, idx) => (
              <tr
                key={admin.id}
                className={`${idx % 2 ? "bg-white" : "bg-gray-50/40"} hover:bg-emerald-50/40 transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-700 grid place-items-center font-bold">
                      {initials(admin.fname, admin.lname)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {admin.fname} {admin.lname}
                      </div>
                      <div className="text-[12px] text-gray-500 flex items-center gap-1">
                        <AtSign className="w-3.5 h-3.5" />
                        {admin.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-800 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {admin.email}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role={admin.role} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-gray-400" />
                    {admin.createdOn ? admin.createdOn.toLocaleString() : "N/A"}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-gray-400" />
                    {admin.modifiedOn ? admin.modifiedOn.toLocaleString() : "N/A"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition"
                      title="View"
                      onClick={() => handleViewAdmin(admin.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                      title="Edit"
                      onClick={() => handleEditAdmin(admin.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition"
                      title="Delete"
                      onClick={() => handleDelete(admin.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                  No admins found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const CardsMobile = (
    <div className="grid sm:hidden gap-3">
      {filtered.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-700 grid place-items-center font-bold">
                {initials(a.fname, a.lname)}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {a.fname} {a.lname}
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {a.email}
                </div>
              </div>
            </div>
            <RoleBadge role={a.role} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="block text-gray-500">Created</span>
              <span>{a.createdOn ? a.createdOn.toLocaleString() : "N/A"}</span>
            </div>
            <div>
              <span className="block text-gray-500">Modified</span>
              <span>{a.modifiedOn ? a.modifiedOn.toLocaleString() : "N/A"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              className="inline-flex items-center justify-center flex-1 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition"
              onClick={() => handleViewAdmin(a.id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </button>
            <button
              className="inline-flex items-center justify-center flex-1 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
              onClick={() => handleEditAdmin(a.id)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </button>
            <button
              className="inline-flex items-center justify-center flex-1 h-9 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition"
              onClick={() => handleDelete(a.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      ))}
      {!filtered.length && !loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No admins found.
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gray-50">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Admin Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create, view, update, and remove admin accounts.
          </p>
        </div>

        {/* Toolbar */}
        <div className="mb-4">{Toolbar}</div>

        {/* Table on md+, cards on mobile */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
            Loading…
          </div>
        ) : (
          <>
            <div className="hidden sm:block">{Table}</div>
            {CardsMobile}
          </>
        )}

        {/* Add / Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl relative">
              {isSubmitting && (
                <div className="absolute inset-0 bg-white/70 z-50 grid place-items-center rounded-2xl">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-emerald-500 h-8 w-8 animate-spin"></div>
                </div>
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </h2>

              <form
                onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="fname"
                    placeholder="First Name"
                    value={formData.fname}
                    onChange={handleInputChange}
                    required
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    name="lname"
                    placeholder="Last Name"
                    value={formData.lname}
                    onChange={handleInputChange}
                    required
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="password"
                  name="password"
                  placeholder={
                    editingAdmin ? "New Password (leave blank to keep current)" : "Password"
                  }
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingAdmin}
                  minLength={6}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={editingAdmin ? "Confirm New Password" : "Confirm Password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!editingAdmin || !!formData.password}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAdmin(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isSubmitting ? "Saving..." : editingAdmin ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal — polished card */}
        {viewModalOpen && viewAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header area with gradient + avatar */}
              <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="absolute top-3 right-4 text-white/80 hover:text-white text-2xl"
                  aria-label="Close"
                >
                  &times;
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 text-white grid place-items-center text-2xl font-bold ring-2 ring-white/30">
                    {initials(viewAdmin.fname, viewAdmin.lname)}
                  </div>
                  <div className="text-white">
                    <div className="text-xl font-extrabold">
                      {viewAdmin.fname} {viewAdmin.lname}
                    </div>
                    <div className="text-sm opacity-90 flex items-center gap-2 mt-0.5">
                      <User className="w-4 h-4" />
                      <span>ID:</span>
                      <span className="font-mono">{viewAdmin.id}</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <RoleBadge role={viewAdmin.role} />
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="flex items-center gap-2 text-gray-800">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {viewAdmin.email}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="text-xs text-gray-500 mb-1">Role</div>
                    <div className="flex items-center gap-2 text-gray-800 capitalize">
                      <Shield className="w-4 h-4 text-gray-500" />
                      {viewAdmin.role}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="text-xs text-gray-500 mb-1">Created On</div>
                    <div className="flex items-center gap-2 text-gray-800">
                      <CalendarClock className="w-4 h-4 text-gray-500" />
                      {viewAdmin.createdOn ? viewAdmin.createdOn.toLocaleString() : "N/A"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-white">
                    <div className="text-xs text-gray-500 mb-1">Modified On</div>
                    <div className="flex items-center gap-2 text-gray-800">
                      <CalendarClock className="w-4 h-4 text-gray-500" />
                      {viewAdmin.modifiedOn ? viewAdmin.modifiedOn.toLocaleString() : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Minimal loader CSS */}
        <style jsx="true">{`
          .loader {
            border-top-color: transparent;
          }
        `}</style>
      </div>
    </Layout>
  );
}
