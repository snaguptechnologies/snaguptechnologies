import React from 'react';
import { Settings, User, Globe, Clock, Shield, CheckCircle, X, Loader2, Award, Plus, Trash2, Eye, EyeOff, FileText, ChevronLeft } from 'lucide-react';

interface SettingsTabProps {
    settingsActiveTab: 'general' | 'profile' | 'payments' | 'notifications' | 'security';
    setSettingsActiveTab: (tab: 'general' | 'profile' | 'payments' | 'notifications' | 'security') => void;
    generalSettings: any;
    setGeneralSettings: (settings: any) => void;
    handleSaveGeneralSettings: (e: React.FormEvent) => void;
    genSaving: boolean;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    profileForm: any;
    setProfileForm: (form: any) => void;
    handleUpdateProfile: (e: React.FormEvent) => void;
    settingsLoading: boolean;
    settingsMessage: { text: string; type: 'success' | 'error' | null };
    upiSettings: any;
    setUpiSettings: (settings: any) => void;
    upiMessage: { text: string; type: 'success' | 'error' | null };
    handleQrUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSaveUpiSettings: (e: React.FormEvent) => void;
    upiSaving: boolean;
    notifSettings: string[];
    setNotifSettings: (settings: string[]) => void;
    handleSaveNotifSettings: (e: React.FormEvent) => void;
    notifSaving: boolean;
    passwordForm: any;
    setPasswordForm: (form: any) => void;
    showPasswords: any;
    setShowPasswords: (show: any) => void;
    handleChangePassword: (e: React.FormEvent) => void;
    previousTab: string;
    onBack: (tab: string) => void;
    mode: 'profile' | 'system';
    handleResetDatabase: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
    settingsActiveTab,
    setSettingsActiveTab,
    generalSettings,
    setGeneralSettings,
    handleSaveGeneralSettings,
    genSaving,
    handleLogoUpload,
    handleFaviconUpload,
    profileForm,
    setProfileForm,
    handleUpdateProfile,
    settingsLoading,
    settingsMessage,
    upiSettings,
    setUpiSettings,
    upiMessage,
    handleQrUpload,
    handleSaveUpiSettings,
    upiSaving,
    notifSettings,
    setNotifSettings,
    handleSaveNotifSettings,
    notifSaving,
    passwordForm,
    setPasswordForm,
    showPasswords,
    setShowPasswords,
    handleChangePassword,
    previousTab,
    onBack,
    mode,
    handleResetDatabase
}) => {
    const getTabLabel = (id: string) => {
        const labels: Record<string, string> = {
            'dashboard': 'System Dashboard',
            'courses': 'Course Matrix',
            'instructors': 'Faculty Roster',
            'students': 'Student Database',
            'batches': 'Operations & Batches',
            'payments': 'Revenue & Billing',
            'attendance': 'Attendance Logs',
            'inquiries': 'Admission Inquiries',
            'emails': 'Communication Logs',
            'certificates': 'Credential Registry'
        };
        return labels[id] || id;
    };
    return (
        <div className="animate-fade-in space-y-10 pb-20 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 md:mb-10">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-1 md:mb-2 text-center md:text-left">
                        {mode === 'profile' ? 'Account Settings' : 'System Configuration'}
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium text-center md:text-left">
                        {mode === 'profile' ? 'Manage your identity and account security.' : 'Configure global site settings and payment gateways.'}
                    </p>
                </div>
                {previousTab && mode === 'profile' && (
                    <button
                        onClick={() => onBack(previousTab)}
                        className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-muted/50 hover:bg-muted border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />

                        Return to {getTabLabel(previousTab)}
                    </button>
                )}
            </div>

            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
                    {/* Settings Navigation - Sticky on mobile */}
                    <div className="w-full lg:w-72 shrink-0 bg-background/80 lg:bg-card/50 backdrop-blur-md lg:backdrop-blur-none p-1.5 lg:p-3 rounded-2xl lg:rounded-[2rem] border border-border/40 sticky top-0 lg:top-10 z-30 overflow-x-auto hide-scrollbar -mx-2 lg:mx-0">
                        <div className="flex lg:flex-col gap-1.5 min-w-max lg:min-w-0 p-1">
                            {(mode === 'system' ? [
                                { id: 'general', label: 'General Settings', icon: <Settings className="w-4 h-4" /> },
                                { id: 'payments', label: 'Payment Gateways', icon: <Globe className="w-4 h-4" /> },
                                { id: 'notifications', label: 'System Reminders', icon: <Clock className="w-4 h-4" /> },
                            ] : [
                                { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
                                { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
                            ]).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSettingsActiveTab(tab.id as any)}
                                    className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-bold transition-all text-xs lg:text-sm group whitespace-nowrap ${settingsActiveTab === tab.id
                                        ? "bg-foreground text-background shadow-lg lg:shadow-2xl shadow-foreground/20 scale-[1.02]"
                                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                                        }`}
                                >
                                    <div className={`shrink-0 transition-transform group-hover:scale-110 ${settingsActiveTab === tab.id ? "text-background" : "text-muted-foreground"}`}>
                                        {tab.icon}
                                    </div>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Settings Content Area */}
                    <div className="flex-1 min-w-0">
                        {settingsActiveTab === 'general' && (
                            <div className="animate-fade-in">
                                <div className="p-5 md:p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-8 md:mb-10">
                                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <User className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">General Settings</h2>
                                            <p className="text-xs text-muted-foreground">Configure global system identity and contact information</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveGeneralSettings} className="space-y-6 md:space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Site Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={generalSettings.site_name || ""}
                                                        onChange={e => setGeneralSettings({ ...generalSettings, site_name: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Contact Email</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={generalSettings.contact_email || ""}
                                                        onChange={e => setGeneralSettings({ ...generalSettings, contact_email: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Contact Phone</label>
                                                    <input
                                                        type="text"
                                                        value={generalSettings.contact_phone || ""}
                                                        onChange={e => setGeneralSettings({ ...generalSettings, contact_phone: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Site Base URL (for QR Codes)</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g. http://localhost:3000 or https://snagup.com"
                                                        value={generalSettings.site_url || ""}
                                                        onChange={e => setGeneralSettings({ ...generalSettings, site_url: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground ml-1 italic">* This URL is used to generate the verification QR code printed on certificates.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">SEO Site Description</label>
                                                    <textarea
                                                        rows={2}
                                                        value={generalSettings.site_description || ""}
                                                        onChange={e => setGeneralSettings({ ...generalSettings, site_description: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium resize-none text-xs"
                                                        placeholder="Enter site description for Google search results..."
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">SEO Keywords</label>
                                                    <input
                                                        type="text"
                                                        value={generalSettings.site_keywords || ""}
                                                        onChange={e => setGeneralSettings({ ...generalSettings, site_keywords: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-xs"
                                                        placeholder="e.g. education, training, coaching"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1">Site Logo</label>
                                                    <div className="p-6 md:p-8 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-500/50 transition-all cursor-pointer relative group/logo bg-muted/20">
                                                        {generalSettings.site_logo ? (
                                                            <img src={generalSettings.site_logo} alt="Logo" className="h-20 object-contain" />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                                                <Globe className="w-8 h-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs font-bold text-foreground">Drop your logo here</p>
                                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">PNG or SVG Recommended</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoUpload}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-xs font-semibold text-muted-foreground ml-1 text-center block w-full">Favicon (Browser Icon)</label>
                                                    <div className="flex items-center gap-6 p-4 bg-muted/30 border border-border/50 rounded-3xl">
                                                        <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden relative group/favicon">
                                                            {generalSettings.favicon_url ? (
                                                                <img src={generalSettings.favicon_url} alt="Favicon" className="w-8 h-8 object-contain" />
                                                            ) : (
                                                                <Globe className="w-8 h-8 text-muted-foreground" />
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFaviconUpload}
                                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-foreground uppercase tracking-widest mb-1">Website Icon</p>
                                                            <p className="text-[10px] text-muted-foreground">Click the box to upload a 32x32 or 64x64 icon.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={genSaving}
                                            className="w-full py-5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/20 text-xs uppercase tracking-[0.2em]"
                                        >
                                            {genSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Save System Changes"}
                                        </button>
                                    </form>

                                    {/* Danger Zone */}
                                    <div className="mt-12 pt-8 border-t border-border">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 md:p-8 bg-rose-500/5 rounded-[2rem] border border-rose-500/20">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-black text-rose-500 mb-2 flex items-center gap-2">
                                                    <Trash2 className="w-5 h-5" /> Danger Zone
                                                </h3>
                                                <p className="text-xs text-rose-500/80 font-medium">
                                                    Permanently wipe the entire database. This action drops all records, enrollments, users, and certificates immediately. The system will auto-rebuild fresh empty tables.
                                                </p>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={handleResetDatabase}
                                                className="w-full md:w-auto px-8 py-4 bg-rose-500 text-white hover:bg-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 whitespace-nowrap shrink-0"
                                            >
                                                Factory Reset System
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {settingsActiveTab === 'profile' && (
                            <div className="animate-fade-in">
                                <div className="p-5 md:p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-8 md:mb-10">
                                        <div className="w-12 h-12 bg-foreground/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <Shield className="w-6 h-6 text-foreground" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Profile Settings</h2>
                                            <p className="text-xs text-muted-foreground">Manage your personal information and contact details</p>
                                        </div>
                                    </div>

                                    {settingsMessage.text && (
                                        <div className={`p-5 rounded-2xl border flex items-center gap-4 text-[11px] font-black uppercase tracking-widest animate-scale-in ${settingsMessage.type === 'success' ? 'bg-foreground/5 border-foreground/20 text-foreground' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                                            {settingsMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                            {settingsMessage.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleUpdateProfile} className="space-y-6 md:space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={profileForm.name}
                                                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={profileForm.email}
                                                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all font-medium"
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={profileForm.phone}
                                                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={settingsLoading}
                                            className="w-full py-4 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-bold transition-all disabled:opacity-50 text-sm"
                                        >
                                            {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Update Profile"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {settingsActiveTab === 'payments' && (
                            <div className="animate-fade-in">
                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <Globe className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Payment Settings</h2>
                                            <p className="text-xs text-muted-foreground">Configure your UPI and QR code payment credentials</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="space-y-8 bg-muted/20 p-8 rounded-3xl border border-border/50">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                                    <Globe className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Manual UPI (QR Code)</h3>
                                            </div>

                                            {upiMessage.text && (
                                                <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 text-[11px] font-black uppercase tracking-widest animate-scale-in ${upiMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                                                    {upiMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                                    {upiMessage.text}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">UPI ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. yourname@upi"
                                                    value={upiSettings.upi_id}
                                                    onChange={e => setUpiSettings({ ...upiSettings, upi_id: e.target.value })}
                                                    className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">QR Code Image</label>
                                                {upiSettings.upi_qr_image && (
                                                    <div className="mb-4 flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
                                                        <img src={upiSettings.upi_qr_image} alt="UPI QR" className="w-20 h-20 rounded-xl object-contain bg-white p-1" />
                                                        <div>
                                                            <p className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1.5">
                                                                <CheckCircle className="w-3.5 h-3.5" /> Current QR Active
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-medium leading-tight">Upload a new image below to replace this QR code.</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/webp"
                                                    onChange={handleQrUpload}
                                                    className="w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:font-bold file:text-xs file:bg-emerald-500 file:text-white hover:file:opacity-90 transition-all border border-dashed border-border p-3 rounded-2xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-8 bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/10 flex flex-col justify-center">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                                    <Award className="w-4 h-4 text-indigo-500" />
                                                </div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Manual verification</h3>
                                            </div>
                                            <div className="p-6 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Operating Mode: Fee-Free</p>
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    We've disabled automated gateways to eliminate transaction fees. Students will scan your QR and enter their UTR. You must manually verify the UTR in your bank app before clicking "Approve".
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveUpiSettings} className="mt-10">
                                        <button
                                            type="submit"
                                            disabled={upiSaving}
                                            className="w-full py-4 bg-foreground hover:bg-foreground/90 text-background rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-foreground/10 text-sm"
                                        >
                                            {upiSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Save All Payment Settings"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {settingsActiveTab === 'notifications' && (
                            <div className="animate-fade-in">
                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <Clock className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Notification Reminders</h2>
                                            <p className="text-xs text-muted-foreground">Set when students and instructors get session alerts</p>
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveNotifSettings} className="space-y-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center px-1 mb-2">
                                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scheduled Intervals</label>
                                                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{notifSettings.length} ACTIVE</span>
                                                </div>
                                                {notifSettings.map((mins, index) => (
                                                    <div key={index} className="flex items-center gap-4 animate-scale-in">
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="number"
                                                                required
                                                                value={mins}
                                                                onChange={e => {
                                                                    const newSettings = [...notifSettings];
                                                                    newSettings[index] = e.target.value;
                                                                    setNotifSettings(newSettings);
                                                                }}
                                                                className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold text-xl text-center"
                                                            />
                                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-40 font-bold text-[10px]">MIN</div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNotifSettings(notifSettings.filter((_, i) => i !== index))}
                                                            className="p-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all group shrink-0"
                                                            title="Remove Reminder"
                                                        >
                                                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => setNotifSettings([...notifSettings, "15"])}
                                                    className="w-full py-4 border border-dashed border-primary/30 rounded-2xl text-primary font-bold text-[10px] hover:bg-primary/5 transition-all flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-widest"
                                                >
                                                    <Plus className="w-4 h-4" /> Add New Reminder Slot
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Clock className="w-24 h-24" />
                                                    </div>
                                                    <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                                        <FileText className="w-4 h-4" /> System Intelligence
                                                    </h3>
                                                    <p className="text-xs text-primary/70 font-medium leading-relaxed relative z-10">
                                                        These intervals define when the automated worker triggers email alerts for upcoming live sessions. Reminders are sent to both Instructors and enrolled Students.
                                                    </p>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={notifSaving}
                                                    className="w-full py-5 bg-foreground text-background hover:bg-foreground/90 rounded-[2rem] font-bold transition-all disabled:opacity-50 shadow-2xl shadow-foreground/20 text-xs uppercase tracking-widest"
                                                >
                                                    {notifSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Finalize & Sync Reminders"}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {settingsActiveTab === 'security' && (
                            <div className="animate-fade-in">
                                <div className="p-8 rounded-3xl bg-card border border-border shadow-sm relative overflow-hidden group">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                            <Shield className="w-6 h-6 text-rose-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">Password & Security</h2>
                                            <p className="text-xs text-muted-foreground">Change your account password to keep it secure</p>
                                        </div>
                                    </div>

                                    {settingsMessage.text && (
                                        <div className={`mb-8 p-5 rounded-2xl border flex items-center gap-4 text-[11px] font-black uppercase tracking-widest animate-scale-in ${settingsMessage.type === 'success' ? 'bg-foreground/5 border-foreground/20 text-foreground' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                                            {settingsMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                            {settingsMessage.text}
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePassword} className="space-y-6">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">Current Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.current ? "text" : "password"}
                                                        required
                                                        value={passwordForm.currentPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                        className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-rose-500 transition-all"
                                                    >
                                                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">New Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        required
                                                        minLength={6}
                                                        value={passwordForm.newPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                        className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-rose-500 transition-all"
                                                    >
                                                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-semibold text-muted-foreground ml-1">Verify Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.verify ? "text" : "password"}
                                                        required
                                                        minLength={6}
                                                        value={passwordForm.confirmPassword}
                                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-medium pr-12"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPasswords({ ...showPasswords, verify: !showPasswords.verify })}
                                                        className="absolute right-4 inset-y-0 flex items-center text-muted-foreground hover:text-rose-500 transition-all"
                                                    >
                                                        {showPasswords.verify ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={settingsLoading}
                                            className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-rose-500/20 text-sm"
                                        >
                                            {settingsLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" strokeWidth={3} /> : "Update Password"}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
