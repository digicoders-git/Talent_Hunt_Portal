import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import RegisterNew from "./Pages/RegisterNew";
import Assessment from "./Pages/Assessment";
import Result from "./Pages/Result";
import AdminLogin from "./Admin/AdminLogin";
import DashboardHome from "./Admin/DashboardHome";
import PrintPaper from "./Admin/PrintPaper";
import PrintAssignedQuestions from "./Admin/PrintAssignedQuestions";
import EditQuestions from "./Admin/EditQuestions";
import AssessmentResult from "./Admin/AssessmentResult";
import AssessmentDetails from "./Admin/AssessmentDetails";
import TopicQuestions from "./Admin/TopicQuestions";
import AssignQuestions from "./Admin/AssignQuestions";
import AdminDashboard from "./Comp/Admincomp/AdminDashboard";
import AcademicSetup from "./Admin/AcademicSetup";
import StartedStudents from "./Admin/StartedStudents";
import { ManageTopics } from "./Admin/ManageTopics";
import { ActiveAssessment } from "./Admin/ActiveAssesment";
import { AssessmentHistory } from "./Admin/AssessmentHistoryEnhanced";
import { ManageStudents } from "./Admin/ManageStudents";
import { SecuritySettings } from "./Admin/SecuritySettings";
import { ManageCertificate } from "./Admin/ManageCertificate";
import LastYearData from "./Admin/LastYearData";
import CreateAdmin from "./Admin/CreateAdmin";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/assessment/:code/:studentId" element={<Assessment />} />
      <Route path="/result/:studentId/:assessmentId/:certificateId" element={<Result />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Nested Routes */}
      <Route path="/admin" element={<AdminDashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="dashboard" element={<DashboardHome />} />
        <Route path="topics" element={<ManageTopics />} />
        <Route path="assessment" element={<ActiveAssessment />} />
        <Route path="history" element={<AssessmentHistory />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="certificate" element={<ManageCertificate />} />
        <Route path="academic" element={<AcademicSetup />} />
        <Route path="security" element={<SecuritySettings />} />
        <Route path="last-year-data" element={<LastYearData />} />
        <Route path="create-admin" element={<CreateAdmin />} />
        <Route path="topic-questions/:topicId" element={<TopicQuestions />} />
        <Route path="assessment/result/:id" element={<AssessmentResult />} />
        <Route path="assessment/details/:id" element={<AssessmentDetails />} />
        <Route path="assign-questions/:id" element={<AssignQuestions />} />
        <Route path="edit/:topicId" element={<EditQuestions />} />
        <Route path="assessment/started-students/:id" element={<StartedStudents />} />
      </Route>
      <Route path="/admin/print-assigned-questions/:id" element={<PrintAssignedQuestions />} />
      <Route path="/admin/print/:topicId" element={<PrintPaper />} />

      {/* Register Route */}
      <Route path="/register" element={<RegisterNew />} />
      <Route path="/register/:code" element={<RegisterNew />} />

      {/* Catch-all route for assessment codes */}
      <Route path="/:code" element={<Login />} />
      <Route path="/certificate/:certId" element={<Login />} />
      <Route path="/certificate/:certId/:assessmentCode" element={<Login />} />
    </Routes>
  );
};

export default AppRoutes;