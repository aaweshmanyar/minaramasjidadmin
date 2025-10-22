// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import firebase from 'firebase/compat/app';
import Layout from './Layout';

const Profile = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        const doc = await firebase.firestore().collection('admins').doc(currentUser.uid).get();
        if (doc.exists) {
          const data = doc.data();
          setUserData({
            ...data,
            uid: currentUser.uid,
            createdOn: data.createdOn?.toDate().toLocaleString() || 'N/A',
            modifiedOn: data.modifiedOn?.toDate().toLocaleString() || 'N/A',
          });
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (!userData) return <div className="p-6 text-white">Loading profile...</div>;

  return (
    <Layout>
      <div className="bg-[rgba(90,108,23,0.83)] text-white p-8 rounded-lg shadow-lg max-w-3xl mx-auto mt-10">
        <h2 className="text-3xl font-semibold mb-6">{userData.fname} Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white pt-4">
          <div>
            <p className="text-sm text-white-400">Full Name</p>
            <p >{userData.fname}</p>
          </div>
          <div>
            <p className="text-sm text-white-400">Email</p>
            <p>{currentUser.email}</p>
          </div>
          <div>
            <p className="text-sm text-white-400">UID</p>
            <p>{userData.uid}</p>
          </div>
          <div>
            <p className="text-sm text-white-400">Role</p>
            <p className="capitalize">{userData.role}</p>
          </div>
          <div>
            <p className="text-sm text-white-400">Created On</p>
            <p>{userData.createdOn}</p>
          </div>
          <div>
            <p className="text-sm text-white-400">Modified On</p>
            <p>{userData.modifiedOn}</p>
          </div>
        </div>

       
      </div>
    </Layout>
  );
};

export default Profile;
