import React from 'react';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, LabelList,
    RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card/80 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
                <p className="text-sm font-black text-foreground">
                    {prefix}{payload[0].value.toLocaleString()}{suffix}
                </p>
            </div>
        );
    }
    return null;
};

export const EnrollmentTrendChart = ({ data }: { data: any[] }) => (
    <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }} 
                    dy={10}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }} 
                />
                <Tooltip content={<CustomTooltip suffix=" Learners" />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--background))' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={1500}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

export const RevenueTrendChart = ({ data }: { data: any[] }) => (
    <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }} 
                    dy={10}
                    interval="preserveStartEnd"
                    minTickGap={30}
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor', opacity: 0.4 }} 
                    domain={[0, 'auto']}
                    allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={4} 
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    animationDuration={1500}
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

const dateBasedBarSize = (len: number) => {
    if (len > 20) return 10;
    if (len > 10) return 20;
    return 40;
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DistributionPieChart = ({ data }: { data: any[] }) => (
    <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700'
                    }} 
                />
                <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    </div>
);

export const RadialProgressChart = ({ data }: { data: any[] }) => {
    // Add fills to data
    const chartData = data.map((d, index) => ({
        ...d,
        fill: d.status === 'upcoming' ? 'rgba(255,255,255,0.1)' : COLORS[index % COLORS.length]
    }));

    return (
        <div className="h-[380px] w-full flex flex-col">
            <div className="flex-1 min-h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="65%" 
                        outerRadius="100%" 
                        barSize={12} 
                        data={chartData}
                        startAngle={90}
                        endAngle={450}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                        />
                        <RadialBar
                            background={{ fill: 'rgba(255,255,255,0.05)' }}
                            dataKey="percentage"
                            cornerRadius={10}
                        />
                        
                        {/* Central HUD - Showing ONLY completion progress */}
                        {chartData[0] && (
                            <g>
                                <text
                                    x="50%"
                                    y="48%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-blue-500 font-extrabold text-3xl tracking-tighter"
                                >
                                    {chartData[0].completed}/{chartData[0].total}
                                </text>
                                <text
                                    x="50%"
                                    y="58%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-muted-foreground font-black text-[9px] uppercase tracking-[0.4em] opacity-40"
                                >
                                    DAYS
                                </text>
                            </g>
                        )}
                        
                        <Tooltip 
                            content={({ active, payload }: any) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-background/90 backdrop-blur-xl border border-border/40 p-4 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">{d.course}</p>
                                            <p className="text-[12px] font-bold text-foreground mb-1">{d.name}</p>
                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                {d.status === 'upcoming' ? 'Scheduled' : `${d.completed}/${d.total} Days Completed`}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
            </div>

            {/* Centered Batch Details Below the Chart */}
            {chartData[0] && (
                <div className="mt-2 flex flex-col items-center justify-center text-center space-y-1">
                    <h4 className="text-base font-black text-foreground tracking-tight uppercase">
                        {chartData[0].name}
                    </h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] opacity-60">
                        {chartData[0].course}
                    </p>
                </div>
            )}
        </div>
    );

};

/**
 * Horizontal Bar Chart showing completion progress (X/Y Days) for active batches.
 */
export const BatchCompletionChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                No active batches found
            </div>
        );
    }

    return (
        <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 25, right: 100, left: 0, bottom: 20 }}
                    barCategoryGap="25%"
                >
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        hide 
                    />
                    <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-background/90 backdrop-blur-xl border border-border/40 p-4 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 text-left">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{d.course}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter ${d.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                {d.status}
                                            </span>
                                        </div>
                                        <p className="text-[12px] font-bold text-foreground mb-1">{d.name}</p>
                                        <div className="h-px w-full bg-border/40 my-2" />
                                        <p className="text-[11px] font-medium text-muted-foreground">
                                            {d.status === 'upcoming' ? (
                                                <>Scheduled for <span className="text-foreground font-bold">{d.total}</span> Days</>
                                            ) : (
                                                <><span className="text-foreground font-bold">{d.completed}</span> / {d.total} Days Completed</>
                                            )}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar 
                        dataKey="percentage" 
                        radius={[0, 4, 4, 0]}
                        barSize={14}
                        minPointSize={10}
                        background={{ fill: 'rgba(255,255,255,0.1)', radius: 4 }}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.status === 'upcoming' ? '#6366f1' : COLORS[index % COLORS.length]} 
                                fillOpacity={entry.status === 'upcoming' ? 0.7 : 1}
                                stroke={entry.status === 'upcoming' ? 'rgba(255,255,255,0.2)' : 'none'}
                            />
                        ))}
                        <LabelList 
                            dataKey="name" 
                            position="top" 
                            content={(props: any) => {
                                const { x, y, index } = props;
                                const d = data[index];
                                if (!d) return null;
                                return (
                                    <text 
                                        x={x} 
                                        y={Number(y) - 10} 
                                        fill={d.status === 'upcoming' ? '#818cf8' : '#888'} 
                                        fontSize="9" 
                                        fontWeight="900" 
                                        textAnchor="start"
                                        style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
                                    >
                                        {d.name} {d.status === 'upcoming' && '(UPCOMING)'}
                                    </text>
                                );
                            }}
                        />
                         <LabelList 
                            dataKey="percentage" 
                            position="right" 
                            content={(props: any) => {
                                const { x, y, width, height, index } = props;
                                const d = data[index];
                                if (!d) return null;
                                // For background visibility, we offset from the right edge of the CHART, not just the bar
                                return (
                                    <text 
                                        x={Number(x) + (d.status === 'upcoming' ? 5 : Number(width) + 8)} 
                                        y={Number(y) + Number(height) / 2 + 3} 
                                        fill={d.status === 'upcoming' ? '#64748b' : '#aaa'} 
                                        fontSize="9" 
                                        fontWeight="900"
                                        textAnchor="start"
                                    >
                                        {d.status === 'upcoming' ? `QUEUED: ${d.total} DAYS` : `${d.completed}/${d.total} DAYS`}
                                    </text>
                                );
                            }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

