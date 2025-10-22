import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import firebaseConfig from '../pages/firebase/firebaseConfig';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(formData.username, formData.password);
      const user = firebase.auth().currentUser;

      if (user) {
        const userRef = firebase.firestore().collection('admins').doc(user.uid);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const userRole = userData.role;
          console.log(userRole)

          Swal.fire({
            icon: 'success',
            title: 'Login successful!',
            showConfirmButton: false,
            timer: 2000
          });

          switch (userRole) {
            case 'superadmin':
              navigate('/dashboard');
              break;
            case 'admin':
              navigate('/dashboard');
              break;
          }
        } else {
          throw new Error('No user data found');
        }
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Error logging in:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error logging in',
        text: error.message,
        showConfirmButton: false,
        timer: 2000
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm"
        onSubmit={handleSubmit}
      >
        <div className="flex justify-center mb-4">
          <img
            src="https://minaramasjid.com/assets/image/logo/minara-masjid.png" // <-- replace with your actual logo path
            alt="Logo"
            className="h-16 w-auto"
          />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-center">Welcome, User!</h2>

        <p className="text-gray-600 mb-6 text-center">Please log in</p>
        <input
          type="text"
          name="username"
          placeholder="User Name"
          value={formData.username}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 pr-10 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/4 right-3 -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <input
          type="submit"
          value="Log In"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
        />
      </form>
    </div>
  );
};

export default Login;
