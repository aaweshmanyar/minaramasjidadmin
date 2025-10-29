import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './component/AuthContext';
import ProtectedRoute from './component/ProtectedRoute';

import Login from './component/Login';

// Public Pages
import AboutContent from './pages/homepage/elements/AboutContent';

// Dashboard & Admin Functional Pages
import DashboardCard from './pages/homepage/elements/DashboardCard';
import CreateBookPage from './pages/homepage/elements/CreateBookPage';
import CreateArticlePage from './pages/homepage/elements/CreateArticlePage';
import ContactList from './pages/ContactList';
import BookList from './pages/homepage/elements/BookList';
import ViewBookDetail from './pages/homepage/elements/ViewBookDetail';
import WriterManagement from './pages/homepage/elements/WriterManagement';
import WriterDetail from './pages/homepage/elements/WriterDetail';
import CreateWriterForm from './pages/homepage/elements/Createwriter';
import ViewArticleList from './pages/homepage/elements/ViewArticleList';
import ViewArticleDetail from './pages/homepage/elements/ViewArticleDetail';
import QuestionList from './pages/homepage/elements/QuestionList';
import CreateQuestion from './pages/homepage/elements/CreateQuestion';
import AdminList from './pages/homepage/elements/Admin';
import TranslatorList from './pages/homepage/elements/TranslatorList';
import LanguagesGrid from './pages/homepage/elements/LanguagesGrid';
import HomeBookSlider from './pages/homepage/elements/HomeBookSlider';
import TopicList from './pages/homepage/elements/TopicList';
import CreateTopic from './pages/homepage/elements/CreateTopic';
import FeedbackList from './pages/homepage/elements/FeedbackList';
import EventList from './pages/homepage/elements/EventList';
import CreateEvent from './pages/homepage/elements/CreateEvent';
import TagList from './pages/homepage/elements/TagsList';
import WriterUpdateForm from './pages/homepage/EditForms/WriterUpdateForm';
import TopicUpdateForm from './pages/homepage/EditForms/TopicUpdateForm';
import ArticleUpdateForm from './pages/homepage/EditForms/ArticleUpdateForm';
import EventUpdateForm from './pages/homepage/EditForms/EventUpdateForm';
import BookDetailUpdatieForm from './pages/homepage/EditForms/BookDetailUpdatieForm';
import QuestionUpdateForm from './pages/homepage/EditForms/QuestionUpdateForm';
import NewDashboard from './pages/homepage/elements/NewDashboard';
import CreateAboutContent from './pages/homepage/elements/CreateAboutContent';
import AboutContentUpdateForm from './pages/homepage/EditForms/AboutContentUpdateForm';
import NewArticleList from './pages/homepage/elements/NewArticleList';
import ProfileDetail from './component/ProfileDetail'
import GalleryList from './pages/homepage/elements/GalleryList';
import CreateGallery from './pages/homepage/elements/CreateGallery';
import CreateTopicsTags from './pages/homepage/elements/CreateTopicsTags';
import TopicsTagsList from './pages/homepage/elements/TopicsTagsList';



const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<Login />} />

          <Route path="/dashboard" element={<NewDashboard />} />
          {/* <Route path="/dashboard" element={<DashboardCard />} /> */}
          <Route path="/book" element={<CreateBookPage />} />
          <Route path="/article" element={<CreateArticlePage />} />
          <Route path="/viewarticle" element={<NewArticleList />} />
          {/* <Route path="/viewarticle" element={<ViewArticleList />} /> */}
          <Route path="/viewarticle/article/:id" element={<ViewArticleDetail />} />
          <Route path="/updatearticle/article/:id" element={<ArticleUpdateForm />} />

          <Route path="/about-content" element={<AboutContent />} />
          <Route path="/createabout" element={<CreateAboutContent />} />
          <Route path="/updateabout/:id" element={<AboutContentUpdateForm />} />

          <Route path="/contact" element={<ContactList />} />
          <Route path="/gallery" element={<GalleryList />} />
          <Route path="/creategallery" element={<CreateGallery />} />
          <Route path="/writers" element={<WriterManagement />} />
          <Route path="/writers/:id" element={<WriterDetail />} />
          <Route path="/writers-update/:id" element={<WriterUpdateForm />} />
          <Route path="/createwriter" element={<CreateWriterForm />} />

 <Route path="/topictagslist" element={<TopicsTagsList />} />
  <Route path="/createtopictags" element={<CreateTopicsTags />} />

          <Route path="/booklist" element={<BookList />} />
          <Route path="/bookdownload" element={<BookList />} />
          <Route path="/viewbook/book/:id" element={<ViewBookDetail />} />
          <Route path="/update-book/book/:id" element={<BookDetailUpdatieForm />} />

          <Route path="/questionlist" element={<QuestionList />} />
          <Route path="/createquestion" element={<CreateQuestion />} />
          <Route path="/question-update/:id" element={<QuestionUpdateForm />} />

          <Route path="/admin" element={<AdminList />} />
          <Route path="/translator" element={<TranslatorList />} />
          <Route path="/languages" element={<LanguagesGrid />} />
          <Route path="/home_book_slider" element={<HomeBookSlider />} />
          <Route path="/topic" element={<TopicList />} />
          <Route path="/topic-update/:id" element={<TopicUpdateForm />} />
          <Route path="/create-topic" element={<CreateTopic />} />


          <Route path="/feedback" element={<FeedbackList />} />
          <Route path="/event" element={<EventList />} />
          <Route path="/event/update-event/:id" element={<EventUpdateForm />} />

          <Route path="/createevent" element={<CreateEvent />} />
          <Route path="/taglist" element={<TagList />} />
          <Route path="/profiledetail" element={<ProfileDetail />} />



          {/* Protected Routes - Admin/Superadmin */}
          {/* <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardCard />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/book" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <CreateBookPage />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/article" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <CreateArticlePage />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/contact" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <ContactList />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/booklist" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <BookList />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/viewbook/book/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <ViewBookDetail />
            </ProtectedRoute>
          } /> */}

          {/* Protected Routes - Admin Only */}
          {/* <Route path="/writers" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <WriterManagement />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/writers/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <WriterDetail />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/createwriter" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateWriterForm />
            </ProtectedRoute>
          } />
          <Route path="/viewarticle" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ViewArticleList />
            </ProtectedRoute>
          } />
          <Route path="/viewarticle/article/:id" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ViewArticleDetail />
            </ProtectedRoute>
          } />
          <Route path="/questionlist" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <QuestionList />
            </ProtectedRoute>
          } />
          <Route path="/createquestion" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateQuestion />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminList />
            </ProtectedRoute>
          } />
          <Route path="/translator" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TranslatorList />
            </ProtectedRoute>
          } />
          <Route path="/languages" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <LanguagesGrid />
            </ProtectedRoute>
          } />
          <Route path="/home_book_slider" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <HomeBookSlider />
            </ProtectedRoute>
          } />
          <Route path="/topic" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TopicList />
            </ProtectedRoute>
          } />
          <Route path="/create-topic" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateTopic />
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FeedbackList />
            </ProtectedRoute>
          } />
          <Route path="/event" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EventList />
            </ProtectedRoute>
          } />
          <Route path="/createevent" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CreateEvent />
            </ProtectedRoute>
          } />
          <Route path="/taglist" element={
            <ProtectedRoute>
              <TagList />
            </ProtectedRoute>
          } /> */}

          {/* Optional: Catch-all for 404 - uncomment if needed */}
          {/* <Route path="*" element={<NotFound />} /> */}

        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
