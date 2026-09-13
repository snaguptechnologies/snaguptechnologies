'use client';

import React, { useState, useEffect } from 'react';
import { Award, Loader2, Search, CheckCircle, XCircle, ArrowLeft, Eye, Clock } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '@/app/lib/api';

interface InstructorAssessmentsProps {
    courseId: number;
    batchId: number;
}

export default function InstructorAssessments({ courseId, batchId }: InstructorAssessmentsProps) {
    const [assessments, setAssessments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
    const [results, setResults] = useState<any[]>([]);
    const [resultsLoading, setResultsLoading] = useState(false);

    useEffect(() => {
        fetchAssessments();
    }, [courseId]);

    const fetchAssessments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ASSESSMENTS}/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssessments(res.data.assessments || []);
        } catch (err) {
            console.error("Failed to fetch assessments", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResults = async (assessment: any) => {
        setSelectedAssessment(assessment);
        setResultsLoading(true);
        try {
            const token = localStorage.getItem("snagup_token");
            const res = await axios.get(`${API_ENDPOINTS.ASSESSMENTS}/${assessment.id}/results`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // The backend already filters to only include the instructor's batches
            setResults(res.data.attempts || []);
        } catch (err) {
            console.error("Failed to fetch results", err);
        } finally {
            setResultsLoading(false);
        }
    };

    if (selectedAssessment) {
        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => setSelectedAssessment(null)}
                        className="p-2 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">{selectedAssessment.title} Results</h2>
                        <p className="text-sm text-muted-foreground">Showing student attempts for your batches.</p>
                    </div>
                </div>

                {resultsLoading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : results.length > 0 ? (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Attempt #</th>
                                        <th className="px-6 py-4">Score</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {results.map((att: any) => (
                                        <tr key={att.attempt_id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-foreground">{att.student_name}</div>
                                                <div className="text-xs text-muted-foreground">{att.student_email}</div>
                                                <div className="text-[10px] uppercase text-primary font-bold mt-1">Batch: {att.batch_name}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono">{att.attempt_number}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold">{att.score_obtained}</span> / {att.total_points}
                                                <div className="text-xs text-muted-foreground">{att.percentage}%</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {att.status === 'in_progress' ? (
                                                    <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                                        <Clock className="w-3 h-3" /> In Progress
                                                    </span>
                                                ) : att.is_passed ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                                        <CheckCircle className="w-3 h-3" /> Passed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-rose-500 bg-rose-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase">
                                                        <XCircle className="w-3 h-3" /> Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {new Date(att.started_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        No students have attempted this assessment yet.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Course Assessments</h2>
                    <p className="text-sm text-muted-foreground">View assessments for this course and monitor student performance.</p>
                </div>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : assessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assessments.map((ass) => (
                        <div key={ass.id} className="bg-card border border-border p-5 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{ass.title}</h3>
                                    {ass.module_title && <p className="text-xs text-muted-foreground mt-1">Module: {ass.module_title}</p>}
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ass.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                    {ass.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center py-3 bg-muted/30 rounded-lg">
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold">Questions</div>
                                    <div className="font-mono font-bold">{ass.question_count}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold">Pass %</div>
                                    <div className="font-mono font-bold">{ass.pass_percentage}%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground uppercase font-bold">Time</div>
                                    <div className="font-mono font-bold">{ass.time_limit_mins ? `${ass.time_limit_mins}m` : 'None'}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => fetchResults(ass)}
                                className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" /> View Student Results
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    No assessments available for this course.
                </div>
            )}
        </div>
    );
}
