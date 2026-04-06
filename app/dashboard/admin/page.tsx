"use client";

import { useState, useEffect } from "react";
import { 
    Users, BookOpen, Layers, CheckCircle, GraduationCap, 
    User, Clock, X, Loader2, Award, Search, Plus, 
    Calendar, XCircle, ArrowRight, AlertCircle,
    Globe, Shield, Settings, 
    MessageSquare, Menu, LogOut, ChevronLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

// Hook
import { useAdminData } from './hooks/useAdminData';

// Sub-components
import DashboardTab from './components/DashboardTab';
import CoursesTab from './components/CoursesTab';
import InstructorsTab from './components/InstructorsTab';
import StudentsTab from './components/StudentsTab';
import BatchesTab from './components/BatchesTab';
import PaymentsTab from './components/PaymentsTab';
import InquiriesTab from './components/InquiriesTab';
import AttendanceTab from './components/AttendanceTab';
import SettingsTab from './components/SettingsTab';
import EmailsTab from './components/EmailsTab';
import CertificatesTab from './components/CertificatesTab';
import AdminModals from './components/AdminModals';
import RejectionModal from './components/modals/RejectionModal';

export default function AdminDashboard() {
    const adminProps = useAdminData();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [previousTab, setPreviousTab] = useState<string>('dashboard');
    const { 
        loading, stats, toast, activeTab, setActiveTab, 
        paymentTab, setPaymentTab, isMobileMenuOpen, setIsMobileMenuOpen, 
        tabLoading, inquiries, courses, instructors, batches, enrollments, 
        approvedEnrollments, payments, students, batchSearch, setBatchSearch, 
        batchCourseFilter, setBatchCourseFilter, batchStatusFilter, setBatchStatusFilter, 
        paymentSearch, setPaymentSearch, paymentStatusFilter, setPaymentStatusFilter, 
        inquirySearch, setInquirySearch, inquiryServiceFilter, setInquiryServiceFilter, 
        inquiryStatusFilter, setInquiryStatusFilter, attendanceSearch, setAttendanceSearch, 
        studentSearch, setStudentSearch, attCourseId, setAttCourseId, attBatchId, setAttBatchId, 
        attendanceData, attLoading, showCourseModal, setShowCourseModal, showBatchModal, 
        setShowBatchModal, showEditBatchModal, setShowEditBatchModal, editBatchForm, setEditBatchForm, 
        showEditCourseModal, setShowEditCourseModal, editCourseForm, setEditCourseForm,
        selectedBatches, bulkLoading, showEnrollmentModal, setShowEnrollmentModal, 
        showCertModal, setShowCertModal, showInstructorModal, setShowInstructorModal, 
        showEditDeadlineModal, setShowEditDeadlineModal, selectedBatchForDeadline, 
        editDeadlineForm, setEditDeadlineForm, profileForm, setProfileForm, 
        passwordForm, setPasswordForm, upiSettings, setUpiSettings, upiSaving, 
        generalSettings, setGeneralSettings, genSaving, notifSettings, setNotifSettings, 
        notifSaving, upiMessage, settingsLoading, settingsMessage, settingsActiveTab, 
        setSettingsActiveTab, showPasswords, setShowPasswords, showInstPassword, 
        setShowInstPassword, courseForm, setCourseForm, batchForm, setBatchForm, 
        instForm, setInstForm, formLoading, filteredBatches, filteredPayments, 
        filteredInquiries, filteredAttendance, filteredStudents, attendanceBatches, 
        selectedPayments, setSelectedPayments, rejectionModal, setRejectionModal,
        loadData, handleLogout, handleInquiryStatus, handleUpdateProfile, 
        handleSaveGeneralSettings, handleUpdateDeadline, showToast, fetchAttendanceData, 
        handleCreateCourse, handleEditCourseSubmit, handleCreateInstructor, handleCreateBatch, handleEditBatchSubmit, 
        handleToggleEnrollment, handleFinalizeBatch, handleArchiveBatch, handleEnrollmentAction, 
        handleBulkEnrollmentAction, handleResetDatabase,
        handleDeleteBatch, handleBulkBatchUpdate, handleQrUpload, handleSaveUpiSettings, 
        handleSaveNotifSettings, handleDeleteCourse, handleEndBatch, handleDeleteUser, 
        handleOfficialClose, handleGenerateCert, openEnrollmentsModal, openCertModal, 
        preloadDropdowns, handleChangePassword, openEditDeadline, handleSelectAllBatches, 
        handleToggleBatchSelection, handleStartBatch, handleLogoUpload, handleFaviconUpload, getLocalDatetime, setToast, setAttendanceData, emailLogs,
        certificates, certSearch, setCertSearch, certCourseFilter, setCertCourseFilter, certBatchFilter, setCertBatchFilter, filteredCertificates, handleDeleteCertificate,
        dashboardSubTab, setDashboardSubTab, handleExport,
        dateRange, setDateRange, chartCourseFilter, setChartCourseFilter, 
        chartBatchFilter, setChartBatchFilter, chartData,
        customStartDate, setCustomStartDate, customEndDate, setCustomEndDate
    } = adminProps;

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
        { id: 'courses', label: 'Courses', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'instructors', label: 'Instructors', icon: <GraduationCap className="w-4 h-4" /> },
        { id: 'batches', label: 'Batches', icon: <Clock className="w-4 h-4" /> },
        { id: 'students', label: 'Students', icon: <User className="w-4 h-4" /> },
        { id: 'payments', label: 'Payments', icon: <Award className="w-4 h-4" /> },
        { id: 'attendance', label: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
        { id: 'certificates', label: 'Certificates', icon: <Award className="w-4 h-4" /> },
        { id: 'inquiries', label: 'Inquiries', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'emails', label: 'Email Logs', icon: <Globe className="w-4 h-4" /> },
        { id: 'system_settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        <>
            {/* Mobile Sidebar — outside all stacking contexts */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 md:hidden text-foreground" style={{ zIndex: 99999 }}>
                    <div className="absolute inset-0 bg-background" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-card border-r border-border p-8 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="flex justify-between items-center mb-12">
                            <div className="flex flex-col">
                                <img src="/brand-logo-v2.png" alt="Snagup Tech" className="h-12 w-auto object-contain mb-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">Administrative</span>
                                <span className="text-xl font-bold text-foreground">Control Center</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-muted rounded-xl border border-border">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id as any); setIsMobileMenuOpen(false); }}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-black transition-all border uppercase tracking-widest ${activeTab === tab.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "text-muted-foreground bg-muted/30 border-border/50 hover:bg-muted"
                                        }`}
                                >
                                    {tab.id === 'dashboard' ? <Globe className="w-5 h-5" /> :
                                        tab.id === 'batches' ? <Layers className="w-5 h-5" /> :
                                            tab.id === 'courses' ? <BookOpen className="w-5 h-5" /> :
                                                tab.id === 'instructors' ? <Shield className="w-5 h-5" /> :
                                                    tab.id === 'students' ? <Users className="w-5 h-5" /> :
                                                        tab.id === 'payments' ? <CheckCircle className="w-5 h-5" /> :
                                                            tab.id === 'attendance' ? <Clock className="w-5 h-5" /> :
                                                                tab.id === 'certificates' ? <Award className="w-5 h-5" /> :
                                                                    tab.id === 'inquiries' ? <MessageSquare className="w-5 h-5" /> :
                                                                        tab.id === 'system_settings' ? <Settings className="w-5 h-5" /> :
                                                                    <Settings className="w-5 h-5" />}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex min-h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden" suppressHydrationWarning>
                {/* Desktop Sidebar */}
                <aside 
                    onMouseEnter={() => setIsSidebarCollapsed(false)}
                    onMouseLeave={() => setIsSidebarCollapsed(true)}
                    className={`hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-2xl sticky top-0 h-screen shrink-0 p-6 transition-all duration-500 ease-in-out group/sidebar overflow-hidden ${isSidebarCollapsed ? 'w-24' : 'w-72 shadow-2xl shadow-primary/5'}`}
                >
                    <div className="mb-12 px-2 flex items-center justify-between">
                        {!isSidebarCollapsed ? (
                            <div className="flex flex-col animate-in fade-in duration-500">
                                <img src="/brand-logo-v2.png" alt="Snagup Tech" className="h-14 w-auto object-contain" />
                            </div>
                        ) : (
                            <div className="w-full flex justify-center animate-in zoom-in duration-500">
                                <img src="/brand-logo-v2.png" alt="Logo" className="h-10 w-10 object-contain" />
                            </div>
                        )}
                    </div>

                    <nav className="space-y-4 flex-1 overflow-y-auto custom-scrollbar py-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    if (tab.id === 'system_settings') setSettingsActiveTab('general');
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-bold transition-all duration-300 relative group/btn ${activeTab === tab.id
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-muted"
                                } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                                title={isSidebarCollapsed ? tab.label : ""}
                            >
                                <div className={`transition-transform duration-500 ${activeTab === tab.id ? 'rotate-[360deg]' : 'group-hover/btn:scale-110'}`}>
                                    {tab.icon}
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className="animate-in slide-in-from-left-4 fade-in duration-500 whitespace-nowrap overflow-hidden">
                                        {tab.label}
                                    </span>
                                )}
                                {activeTab === tab.id && isSidebarCollapsed && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-l-full" />
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="pt-8 border-t border-border mt-auto">
                        <div className={`p-4 rounded-3xl bg-muted/30 border border-border/50 transition-all duration-500 ${isSidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase shrink-0">
                                    {profileForm.name?.charAt(0) || 'A'}
                                </div>
                                {!isSidebarCollapsed && (
                                    <div className="min-w-0 animate-in fade-in duration-500">
                                        <p className="text-sm font-bold truncate">{profileForm.name || 'Admin'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background/50 relative">
                    {/* Header */}
                    <header className="h-20 shrink-0 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-50">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-2.5 bg-muted rounded-xl hover:bg-muted/80 transition-colors border border-border"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
                                    {activeTab === 'settings' ? 'Admin Profile' : 
                                     activeTab === 'system_settings' ? 'System Configuration' :
                                     tabs.find(t => t.id === activeTab)?.label}
                                </h1>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">
                                    {activeTab === 'settings' ? 'Identity & Security' : 
                                     activeTab === 'system_settings' ? 'Infrastructure Control' :
                                     'Operational Management'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => {
                                    if (activeTab !== 'settings') setPreviousTab(activeTab);
                                    setActiveTab('settings');
                                    setSettingsActiveTab('profile');
                                }}
                                className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 ${activeTab === 'settings' ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}
                                title="Admin Settings"
                            >
                                <User className="w-5 h-5" />
                            </button>
                            <ThemeToggle />
                            <button
                                onClick={handleLogout}
                                className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    {/* Content Scroll Container */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative z-10">
                        {/* Subtle background glow effects for admin area */}
                        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-foreground/5 rounded-full blur-[160px] pointer-events-none opacity-20 z-0" />
                        <div className="fixed bottom-0 left-1/4 w-[800px] h-[600px] bg-foreground/3 rounded-full blur-[160px] pointer-events-none opacity-10 z-0" />

                        <div className="relative z-10">
                            {/* DASHBOARD TAB */}
                            {activeTab === 'dashboard' && (
                                <DashboardTab 
                                    stats={stats}
                                    setActiveTab={setActiveTab}
                                    openEnrollmentsModal={openEnrollmentsModal}
                                    openCertModal={openCertModal}
                                    setShowCourseModal={setShowCourseModal}
                                    dashboardSubTab={dashboardSubTab}
                                    setDashboardSubTab={setDashboardSubTab}
                                    handleExport={handleExport}
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    customStartDate={customStartDate}
                                    setCustomStartDate={setCustomStartDate}
                                    customEndDate={customEndDate}
                                    setCustomEndDate={setCustomEndDate}
                                    chartCourseFilter={chartCourseFilter}
                                    setChartCourseFilter={setChartCourseFilter}
                                    chartBatchFilter={chartBatchFilter}
                                    setChartBatchFilter={setChartBatchFilter}
                                    chartData={chartData}
                                    courses={courses}
                                    batches={batches}
                                    enrollments={enrollments}
                                    handleEnrollmentAction={handleEnrollmentAction}
                                    handleToggleEnrollment={handleToggleEnrollment}
                                    handleStartBatch={handleStartBatch}
                                    handleEndBatch={handleEndBatch}
                                    handleFinalizeBatch={handleFinalizeBatch}
                                />
                            )}

                            {/* COURSES TAB */}
                            {activeTab === 'courses' && (
                                <CoursesTab 
                                    courses={courses}
                                    tabLoading={tabLoading}
                                    setShowCourseModal={setShowCourseModal}
                                    handleDeleteCourse={handleDeleteCourse}
                                    setShowEditCourseModal={setShowEditCourseModal}
                                    setEditCourseForm={setEditCourseForm}
                                />
                            )}

                            {/* INSTRUCTORS TAB */}
                            {activeTab === 'instructors' && (
                                <InstructorsTab 
                                    instructors={instructors}
                                    tabLoading={tabLoading}
                                    setShowInstructorModal={setShowInstructorModal}
                                    handleDeleteUser={handleDeleteUser}
                                />
                            )}

                            {/* STUDENTS TAB */}
                            {activeTab === 'students' && (
                                <StudentsTab 
                                    students={students}
                                    studentSearch={studentSearch}
                                    setStudentSearch={setStudentSearch}
                                    filteredStudents={filteredStudents}
                                    tabLoading={tabLoading}
                                    handleDeleteUser={handleDeleteUser}
                                />
                            )}

                            {/* BATCHES TAB */}
                            {activeTab === 'batches' && (
                                <BatchesTab 
                                    batches={batches}
                                    filteredBatches={filteredBatches}
                                    batchSearch={batchSearch}
                                    setBatchSearch={setBatchSearch}
                                    batchCourseFilter={batchCourseFilter}
                                    setBatchCourseFilter={setBatchCourseFilter}
                                    batchStatusFilter={batchStatusFilter}
                                    setBatchStatusFilter={setBatchStatusFilter}
                                    selectedBatches={selectedBatches}
                                    handleSelectAllBatches={handleSelectAllBatches}
                                    handleToggleBatchSelection={handleToggleBatchSelection}
                                    tabLoading={tabLoading}
                                    courses={courses}
                                    preloadDropdowns={preloadDropdowns}
                                    setBatchForm={setBatchForm}
                                    setShowBatchModal={setShowBatchModal}
                                    handleToggleEnrollment={handleToggleEnrollment}
                                    handleFinalizeBatch={handleFinalizeBatch}
                                    openEditDeadline={openEditDeadline}
                                    handleStartBatch={handleStartBatch}
                                    handleEndBatch={handleEndBatch}
                                    handleArchiveBatch={handleArchiveBatch}
                                    setEditBatchForm={setEditBatchForm}
                                    setShowEditBatchModal={setShowEditBatchModal}
                                    handleDeleteBatch={handleDeleteBatch}
                                    handleBulkBatchUpdate={handleBulkBatchUpdate}
                                    bulkLoading={bulkLoading}
                                    getLocalDatetime={getLocalDatetime}
                                />
                            )}

                            {/* PAYMENTS TAB */}
                            {activeTab === 'payments' && (
                                <PaymentsTab 
                                    paymentTab={paymentTab}
                                    setPaymentTab={setPaymentTab}
                                    paymentStatusFilter={paymentStatusFilter}
                                    setPaymentStatusFilter={setPaymentStatusFilter}
                                    payments={payments}
                                    paymentSearch={paymentSearch}
                                    setPaymentSearch={setPaymentSearch}
                                    filteredPayments={filteredPayments}
                                    tabLoading={tabLoading}
                                    handleEnrollmentAction={handleEnrollmentAction}
                                    selectedPayments={selectedPayments}
                                    setSelectedPayments={setSelectedPayments}
                                    handleBulkEnrollmentAction={handleBulkEnrollmentAction}
                                />
                            )}

                            {/* ATTENDANCE TAB */}
                            {activeTab === 'attendance' && (
                                <AttendanceTab 
                                    attendanceSearch={attendanceSearch}
                                    setAttendanceSearch={setAttendanceSearch}
                                    attCourseId={attCourseId}
                                    setAttCourseId={setAttCourseId}
                                    setAttBatchId={setAttBatchId}
                                    setAttendanceData={setAttendanceData}
                                    attBatchId={attBatchId}
                                    courses={courses}
                                    attendanceBatches={attendanceBatches}
                                    attLoading={attLoading}
                                    filteredAttendance={filteredAttendance}
                                    attendanceData={attendanceData}
                                />
                            )}

                            {/* INQUIRIES TAB */}
                            {activeTab === 'inquiries' && (
                                <InquiriesTab 
                                    inquirySearch={inquirySearch}
                                    setInquirySearch={setInquirySearch}
                                    inquiryServiceFilter={inquiryServiceFilter}
                                    setInquiryServiceFilter={setInquiryServiceFilter}
                                    inquiryStatusFilter={inquiryStatusFilter}
                                    setInquiryStatusFilter={setInquiryStatusFilter}
                                    filteredInquiries={filteredInquiries}
                                    inquiries={inquiries}
                                    tabLoading={tabLoading}
                                    handleInquiryStatus={handleInquiryStatus}
                                />
                            )}

                            {/* EMAILS TAB */}
                            {activeTab === 'emails' && (
                                <EmailsTab emailLogs={emailLogs} />
                            )}

                            {/* CERTIFICATES TAB */}
                            {activeTab === 'certificates' && (
                                <CertificatesTab 
                                    certificates={certificates}
                                    filteredCertificates={filteredCertificates}
                                    certSearch={certSearch}
                                    setCertSearch={setCertSearch}
                                    certCourseFilter={certCourseFilter}
                                    setCertCourseFilter={setCertCourseFilter}
                                    certBatchFilter={certBatchFilter}
                                    setCertBatchFilter={setCertBatchFilter}
                                    tabLoading={tabLoading}
                                    handleDeleteCertificate={handleDeleteCertificate}
                                    courses={courses}
                                    batches={batches}
                                />
                            )}

                            {/* SETTINGS / PROFILE TAB */}
                            {(activeTab === 'settings' || activeTab === 'system_settings') && (
                                <SettingsTab 
                                    {...adminProps}
                                    onBack={setActiveTab as any}
                                    previousTab={previousTab}
                                    mode={activeTab === 'settings' ? 'profile' : 'system'}
                                    handleResetDatabase={handleResetDatabase}
                                />
                            )}

                            <AdminModals {...adminProps} />
                            
                            <RejectionModal 
                                show={rejectionModal.show}
                                onClose={() => setRejectionModal({ ...rejectionModal, show: false })}
                                onSubmit={(reason) => {
                                    if (rejectionModal.isBulk) {
                                        handleBulkEnrollmentAction('rejected', reason);
                                    } else {
                                        handleEnrollmentAction(rejectionModal.targetIds[0], 'rejected', 'invalid', reason);
                                    }
                                }}
                                isBulk={rejectionModal.isBulk}
                                count={rejectionModal.targetIds.length}
                            />
                        </div>
                    </div>
                </main>

                {/* Premium Toast Notification System */}
                {toast && (
                    <div className="fixed bottom-10 right-10 z-[1000] animate-in slide-in-from-right-10 fade-in duration-300">
                        <div className={`px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10 backdrop-blur-xl ${toast.type === 'success' ? 'bg-emerald-500 text-white' : toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-foreground text-background'}`}>
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                            {toast.type === 'info' && <AlertCircle className="w-5 h-5" />}
                            <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
                            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}