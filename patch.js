const fs = require('fs');
let content = fs.readFileSync('app/dashboard/student/workspace/[batchId]/page.tsx', 'utf8');

const searchState = '    const [error, setError] = useState("");';
const replaceState =     const [error, setError] = useState("");
    const [markingRead, setMarkingRead] = useState(false);

    const handleMarkAsRead = async () => {
        try {
            setMarkingRead(true);
            const token = localStorage.getItem("snagup_token");
            await axios.post(\\/\/read-guideline\, {}, {
                headers: { Authorization: \Bearer \\ }
            });
            setBatch((prev) => ({ ...prev, last_read_guideline_at: new Date().toISOString() }));
        } catch (err) {
            console.error("Failed to mark as read");
        } finally {
            setMarkingRead(false);
        }
    };;

content = content.replace(searchState, replaceState);

const searchJSX = '                                        <div className="flex items-center gap-3">\r\n                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-amber-500/70 border-b border-amber-300 dark:border-amber-500/20 pb-1">Essential Guidelines</h3>\r\n                                            <span className="text-[9px] font-bold text-neutral-500 dark:text-amber-500/30 uppercase tracking-widest">Priority Sync</span>\r\n                                        </div>';

// Alternative if previous replacement failed due to \r\n, try replacing globally the target JSX string regardless of space
const targetRegex = /<div className="flex items-center gap-3">\s*<h3 className="text-\[10px\] font-black uppercase tracking-\[0.2em\] text-black dark:text-amber-500\/70 border-b border-amber-300 dark:border-amber-500\/20 pb-1">Essential Guidelines<\/h3>\s*<span className="text-\[9px\] font-bold text-neutral-500 dark:text-amber-500\/30 uppercase tracking-widest">Priority Sync<\/span>\s*<\/div>/g;

content = content.replace(targetRegex, \<div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black dark:text-amber-500/70 border-b border-amber-300 dark:border-amber-500/20 pb-1">Essential Guidelines</h3>
                                                <span className="text-[9px] font-bold text-neutral-500 dark:text-amber-500/30 uppercase tracking-widest">Priority Sync</span>
                                            </div>
                                            {(!batch.last_read_guideline_at || new Date(batch.broadcast_updated_at) > new Date(batch.last_read_guideline_at)) && (
                                                <button
                                                    onClick={handleMarkAsRead}
                                                    disabled={markingRead}
                                                    className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                    {markingRead ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Mark as Read'}
                                                </button>
                                            )}
                                        </div>\);

// Also change space-y-3 to space-y-3 flex-1
content = content.replace(/<div className="space-y-3">(\s*<div className="flex items-center)/g, '<div className="space-y-3 flex-1">');

fs.writeFileSync('app/dashboard/student/workspace/[batchId]/page.tsx', content);

console.log('Patched workspace');
