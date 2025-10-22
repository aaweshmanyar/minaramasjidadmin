import React, { useEffect, useState } from "react";
import Layout from "../../../component/Layout";
import Swal from "sweetalert2";
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import firebaseConfig from "../../firebase/firebaseConfig"
import { UserPlus, Pencil, Eye, Trash2 } from "lucide-react";

// Initialize Firebase app
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

export default function AdminList() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
  });

  const [viewAdmin, setViewAdmin] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

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

  const fetchAdmins = async () => {
    try {
      const snapshot = await db.collection('admins')
        .where('deleted', '!=', true)
        .get();
      const adminsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdOn: doc.data().createdOn?.toDate(),
        modifiedOn: doc.data().modifiedOn?.toDate()
      }));
      setAdmins(adminsData);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      Swal.fire("Error", "Failed to fetch admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fname || !formData.lname || !formData.email || !formData.role) {
      Swal.fire("Validation Error", "All fields are required", "warning");
      return false;
    }

    if (!['admin', 'superadmin'].includes(formData.role)) {
      Swal.fire("Validation Error", "Role must be either 'admin' or 'superadmin'", "warning");
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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Swal.fire("Validation Error", "Please enter a valid email address.", "warning");
      return false;
    }

    return true;
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      // First create the user in Firebase Authentication
      const userCredential = await auth.createUserWithEmailAndPassword(
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;

      // Then create the admin document in Firestore
      const { confirmPassword, password, ...dataToSend } = formData;
      const adminData = {
        ...dataToSend,
        uid: userId,
        createdOn: firebase.firestore.FieldValue.serverTimestamp(),
        modifiedOn: firebase.firestore.FieldValue.serverTimestamp(),
        deleted: false
      };

      await db.collection('admins').doc(userId).set(adminData);

      Swal.fire("Success", "Admin created successfully!", "success");
      fetchAdmins();
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error("Error adding admin:", error);
      let errorMessage = "Failed to create admin";

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email is already in use by another account";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email address is invalid";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      }

      Swal.fire("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAdminClick = () => {
    setEditingAdmin(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEditAdmin = async (id) => {
    try {
      const doc = await db.collection('admins').doc(id).get();
      if (doc.exists) {
        setEditingAdmin({
          id: doc.id,
          ...doc.data()
        });
        setShowAddForm(true);
      } else {
        Swal.fire("Error", "Admin not found", "error");
      }
    } catch (err) {
      console.error("Error fetching admin:", err);
      Swal.fire("Error", "Failed to fetch admin details", "error");
    }
  };

 const handleDelete = async (id) => {
  if (id === auth.currentUser?.uid) {
    Swal.fire("Error", "You cannot delete your own account", "error");
    return;
  }

  const confirm = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
  });

  if (confirm.isConfirmed) {
    try {
      // Hard delete from Firestore
      await db.collection('admins').doc(id).delete();

      Swal.fire("Deleted!", "Admin has been permanently deleted.", "success");
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error("Error deleting admin:", error);
      Swal.fire("Error", "Failed to delete admin", "error");
    }
  }
};

  const handleViewAdmin = async (id) => {
    try {
      const doc = await db.collection('admins').doc(id).get();
      if (doc.exists) {
        setViewAdmin({
          id: doc.id,
          ...doc.data(),
          createdOn: doc.data().createdOn?.toDate(),
          modifiedOn: doc.data().modifiedOn?.toDate()
        });
        setViewModalOpen(true);
      } else {
        Swal.fire("Error", "Admin not found", "error");
      }
    } catch (err) {
      console.error("Error fetching admin details:", err);
      Swal.fire("Error", "Failed to fetch admin details.", "error");
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
      const { confirmPassword, password, ...dataToSend } = formData;
      const updatedData = {
        ...dataToSend,
        modifiedOn: firebase.firestore.FieldValue.serverTimestamp(),
      };

      // Update Firestore document
      await db.collection('admins').doc(editingAdmin.id).update(updatedData);

      // If password was changed, update it in Firebase Auth
      if (password) {
        try {
          // This requires recent authentication - should be handled by re-authenticating the user first
          // For simplicity, we'll just show a message here
          Swal.fire("Info", "To change password, please use the password reset feature after logging out.", "info");
        } catch (error) {
          console.error("Error updating password:", error);
        }
      }

      Swal.fire("Success", "Admin updated successfully!", "success");
      fetchAdmins();
      setShowAddForm(false);
      setEditingAdmin(null);
      resetForm();
    } catch (error) {
      console.error("Error updating admin:", error);
      let errorMessage = "Failed to update admin";

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = "To change sensitive account information, you need to recently login. Please logout and login again.";
      }

      Swal.fire("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fname: "",
      lname: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin"
    });
  };

  return (
    <Layout>
      <div className="min-h-screen p-6 md:p-8 relative">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
            Admin Management
          </h1>

          <button
            onClick={handleAddAdminClick}
            className="bg-[#5a6c17] hover:bg-[rgba(90,108,23,0.83)] text-white font-medium px-4 py-2 rounded-lg transition-all text-sm md:text-base flex items-center gap-2"
          >
                       <UserPlus className="w-5 h-5" />
                       Add Admin     
          </button>


        </div>


        {loading ? (
          <div className="text-center text-lg font-medium text-gray-500">Loading...</div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg shadow border border-gray-200 custom-scrollbar">
            <table className="min-w-[900px] w-full text-left bg-white">
              <thead className="bg-gray-50 text-gray-700 text-lg font-semibold">
                <tr>
                  <th className="px-4 py-3 border-b text-lg">Name</th>
                  <th className="px-4 py-3 border-b text-lg">Email</th>
                  <th className="px-4 py-3 border-b text-lg">Role</th>
                  <th className="px-4 py-3 border-b text-lg">Created On</th>
                  <th className="px-4 py-3 border-b text-lg">Modified On</th>
                  <th className="px-4 py-3 border-b text-lg">Action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-4 py-3 border-b font-medium text-gray-800 text-lg">
                      {admin.fname} {admin.lname}
                    </td>
                    <td className="px-4 py-3 border-b text-gray-600 text-lg">{admin.email}</td>
                    <td className="px-4 py-3 border-b text-gray-600 capitalize text-lg">
                      {admin.role}
                    </td>
                    <td className="px-4 py-3 border-b text-gray-600 text-lg">
                      {admin.createdOn ? admin.createdOn.toLocaleString() : "N/A"}
                    </td>
                    <td className="px-4 py-3 border-b text-gray-600 text-lg">
                      {admin.modifiedOn ? admin.modifiedOn.toLocaleString() : "N/A"}
                    </td>
                    <td className="px-4 py-3 border-b">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          onClick={() => handleViewAdmin(admin.id)}
                        >
                       <Eye size={18} />
                        </button>
                        <button
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          onClick={() => handleEditAdmin(admin.id)}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          onClick={() => handleDelete(admin.id)}
                        >
                       <Trash2 size={18} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-lg relative">
              {isSubmitting && (
                <div className="absolute inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center rounded-xl">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 h-8 w-8 animate-spin"></div>
                </div>
              )}
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
              </h2>

              <form onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    name="fname"
                    placeholder="First Name"
                    value={formData.fname}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-3 py-2 w-full"
                  />
                  <input
                    type="text"
                    name="lname"
                    placeholder="Last Name"
                    value={formData.lname}
                    onChange={handleInputChange}
                    required
                    className="border rounded px-3 py-2 w-full"
                  />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  type="password"
                  name="password"
                  placeholder={editingAdmin ? "New Password (leave blank to keep current)" : "Password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingAdmin}
                  minLength={6}
                  className="border rounded px-3 py-2 w-full"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={editingAdmin ? "Confirm New Password" : "Confirm Password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!editingAdmin || formData.password}
                  className="border rounded px-3 py-2 w-full"
                />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="border rounded px-3 py-2 w-full"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingAdmin(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSubmitting ? "Saving..." : editingAdmin ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewModalOpen && viewAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-lg relative">
              <button
                onClick={() => setViewModalOpen(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-3xl"
              >
                &times;
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Admin Details</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Full Name:</strong> {viewAdmin.fname} {viewAdmin.lname}</p>
                <p><strong>Email:</strong> {viewAdmin.email}</p>
                <p><strong>Role:</strong> {viewAdmin.role}</p>
                <p><strong>Created On:</strong> {viewAdmin.createdOn ? viewAdmin.createdOn.toLocaleString() : "N/A"}</p>
                <p><strong>Modified On:</strong> {viewAdmin.modifiedOn ? viewAdmin.modifiedOn.toLocaleString() : "N/A"}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spinner Style */}
      <style jsx>{`
        .loader {
          border-top-color: transparent;
        }
      `}</style>
    </Layout>
  );
}