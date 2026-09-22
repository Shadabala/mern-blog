import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import DataProvider from "./context/DataProvider";
import { LanguageProvider } from "./context/LanguageContext";
import { SettingsProvider } from "./context/SettingsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RTLProvider from "./components/common/RTLProvider";
import AppToastContainer from "./components/common/AppToastContainer";

// Layouts
import AdminLayout from "./layouts/AdminLayout";

// Public Pages
import Home from "./pages/public/Home";
import BlogDetail from "./pages/public/BlogDetail";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";

// User Dashboard & Payment Pages
import Dashboard from "./components/Dashboard";
import CreatePost from "./components/create/CreatePost";
import Update from "./components/create/Update";
import PaymentSuccess from "./pages/user/PaymentSuccess";
import PaymentCancel from "./pages/user/PaymentCancel";
import PaymentHistory from "./pages/user/PaymentHistory";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersList from "./pages/admin/UsersList";
import CategoryList from "./pages/admin/CategoryList";
import CategoryCreate from "./pages/admin/CategoryCreate";
import CategoryEdit from "./pages/admin/CategoryEdit";
import BlogList from "./pages/admin/BlogList";
import BlogCreate from "./pages/admin/BlogCreate";
import BlogEdit from "./pages/admin/BlogEdit";
import ActivityLogs from "./pages/admin/ActivityLogs";
import LoginHistory from "./pages/admin/LoginHistory";
import ContactInquiries from "./pages/admin/ContactInquiries";
import LanguageSettings from "./pages/admin/LanguageSettings";
import LanguageCreate from "./pages/admin/LanguageCreate";
import LanguageEdit from "./pages/admin/LanguageEdit";
import FileSystemSettings from "./pages/admin/FileSystemSettings";
import UploadedFiles from "./pages/admin/UploadedFiles";
import UploadNewFile from "./pages/admin/UploadNewFile";

// Website Setup Pages
import HomepageSettings from "./pages/admin/HomepageSettings";
import HeaderSettings from "./pages/admin/HeaderSettings";
import FooterSettings from "./pages/admin/FooterSettings";
import AppearanceSettings from "./pages/admin/AppearanceSettings";
import PagesList from "./pages/admin/PagesList";
import PageCreate from "./pages/admin/PageCreate";
import PageEdit from "./pages/admin/PageEdit";

// Setup & Configuration Pages
import FeatureActivation from "./pages/admin/FeatureActivation";
import SmtpSettings from "./pages/admin/SmtpSettings";
import PaymentMethodsSettings from "./pages/admin/PaymentMethodsSettings";
import OfflinePayments from "./pages/admin/OfflinePayments";
import GoogleSettings from "./pages/admin/GoogleSettings";

// Staff Management Pages
import StaffList from "./pages/admin/StaffList";
import StaffRoles from "./pages/admin/StaffRoles";

function AppRoutes() {
  return (
    <Routes>
      {/* Public Website Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="/details/:id" element={<BlogDetail />} />

      {/* User Dashboard & Stripe Payment Routes */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="/update/:id" element={<Update />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancel" element={<PaymentCancel />} />
      <Route path="/payments" element={<PaymentHistory />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Admin & Staff Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
        <Route element={<AdminLayout />}>
          {/* Dashboard (Open to all admin & staff) */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Uploaded Files */}
          <Route element={<ProtectedRoute requiredPermission="uploads_view" />}>
            <Route path="/admin/uploaded-files" element={<UploadedFiles />} />
            <Route path="/admin/uploaded-files/create" element={<UploadNewFile />} />
          </Route>

          {/* Blogs */}
          <Route element={<ProtectedRoute requiredPermission="blogs_view" />}>
            <Route path="/admin/blogs" element={<BlogList />} />
            <Route path="/admin/posts" element={<BlogList />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="blogs_create" />}>
            <Route path="/admin/blogs/create" element={<BlogCreate />} />
            <Route path="/admin/posts/create" element={<BlogCreate />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="blogs_edit" />}>
            <Route path="/admin/blogs/:id/edit" element={<BlogEdit />} />
            <Route path="/admin/posts/:id/edit" element={<BlogEdit />} />
          </Route>

          {/* Categories */}
          <Route element={<ProtectedRoute requiredPermission="categories_manage" />}>
            <Route path="/admin/categories" element={<CategoryList />} />
            <Route path="/admin/categories/create" element={<CategoryCreate />} />
            <Route path="/admin/categories/:id/edit" element={<CategoryEdit />} />
          </Route>

          {/* Users */}
          <Route element={<ProtectedRoute requiredPermission="users_view" />}>
            <Route path="/admin/users" element={<UsersList />} />
          </Route>

          {/* Contact Inquiries */}
          <Route element={<ProtectedRoute requiredPermission="contacts_manage" />}>
            <Route path="/admin/contacts" element={<ContactInquiries />} />
          </Route>

          {/* Login History */}
          <Route element={<ProtectedRoute requiredPermission="login_history_view" />}>
            <Route path="/admin/login-history" element={<LoginHistory />} />
          </Route>

          {/* Activity Logs */}
          <Route element={<ProtectedRoute requiredPermission="logs_view" />}>
            <Route path="/admin/logs" element={<ActivityLogs />} />
          </Route>

          {/* File System */}
          <Route element={<ProtectedRoute requiredPermission="file_system_manage" />}>
            <Route path="/admin/file_system" element={<FileSystemSettings />} />
            <Route path="/admin/setup/file-system" element={<FileSystemSettings />} />
          </Route>

          {/* Website Setup Submenu Routes */}
          <Route element={<ProtectedRoute requiredPermission="homepage_settings" />}>
            <Route path="/admin/website-setup/homepage" element={<HomepageSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="header_settings" />}>
            <Route path="/admin/website-setup/header" element={<HeaderSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="footer_settings" />}>
            <Route path="/admin/website-setup/footer" element={<FooterSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="appearance_manage" />}>
            <Route path="/admin/website-setup/appearance" element={<AppearanceSettings />} />
            <Route path="/admin/settings" element={<AppearanceSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="pages_manage" />}>
            <Route path="/admin/website-setup/pages" element={<PagesList />} />
            <Route path="/admin/website-setup/pages/create" element={<PageCreate />} />
            <Route path="/admin/website-setup/pages/:id/edit" element={<PageEdit />} />
          </Route>

          {/* Setup & Configuration Submenu Routes */}
          <Route element={<ProtectedRoute requiredPermission="feature_activation" />}>
            <Route path="/admin/setup/features" element={<FeatureActivation />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="languages_manage" />}>
            <Route path="/admin/setup/language" element={<LanguageSettings />} />
            <Route path="/admin/setup/languages" element={<LanguageSettings />} />
            <Route path="/admin/setup/languages/create" element={<LanguageCreate />} />
            <Route path="/admin/setup/language/create" element={<LanguageCreate />} />
            <Route path="/admin/setup/languages/:id/edit" element={<LanguageEdit />} />
            <Route path="/admin/setup/language/:id/edit" element={<LanguageEdit />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="smtp_manage" />}>
            <Route path="/admin/setup/smtp" element={<SmtpSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="payment_methods_manage" />}>
            <Route path="/admin/setup/payment-methods" element={<PaymentMethodsSettings />} />
            <Route path="/admin/setup/offline-payments" element={<OfflinePayments />} />
            <Route path="/admin/offline-payments" element={<OfflinePayments />} />
            <Route path="/admin/payments" element={<OfflinePayments />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="google_manage" />}>
            <Route path="/admin/setup/google" element={<GoogleSettings />} />
          </Route>

          {/* Staff Submenu Routes */}
          <Route element={<ProtectedRoute requiredPermission="staff_view" />}>
            <Route path="/admin/staff" element={<StaffList />} />
            <Route path="/admin/staff/all" element={<StaffList />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="roles_manage" />}>
            <Route path="/admin/staff/permissions" element={<StaffRoles />} />
            <Route path="/admin/roles" element={<StaffRoles />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <LanguageProvider>
            <SettingsProvider>
              <RTLProvider>
                <AppRoutes />
                <AppToastContainer />
              </RTLProvider>
            </SettingsProvider>
          </LanguageProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;