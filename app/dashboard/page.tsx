import {
  FolderKanban,
  DollarSign,
  FileSpreadsheet,
  Clock,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const stats = [
    {
      title: "Active Projects",
      value: "8 Jobs",
      change: "+2 this week",
      icon: FolderKanban,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Total Revenue",
      value: "$14,850.00",
      change: "+12% vs last month",
      icon: DollarSign,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Pending Estimates",
      value: "5 Pending",
      change: "3 awaiting approval",
      icon: FileSpreadsheet,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Labour Hours",
      value: "142.5 hrs",
      change: "Logged this month",
      icon: Clock,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const recentProjects = [
    {
      id: "PRJ-101",
      title: "Commercial Panel Upgrade",
      client: "Apex Retail Plaza",
      status: "In Progress",
      dueDate: "Sep 20, 2026",
      amount: "$4,500.00",
      statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "PRJ-102",
      title: "Residential Rewiring & Lighting",
      client: "Sarah Jenkins",
      status: "Completed",
      dueDate: "Sep 12, 2026",
      amount: "$2,800.00",
      statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "PRJ-103",
      title: "EV Charger Installation",
      client: "Marcus Vance",
      status: "Scheduled",
      dueDate: "Sep 25, 2026",
      amount: "$1,250.00",
      statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "PRJ-104",
      title: "Industrial Generator Hookup",
      client: "Metro Logistics Warehouse",
      status: "Pending Material",
      dueDate: "Oct 02, 2026",
      amount: "$6,300.00",
      statusColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Electrical Operations Overview
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor active electrical jobs, material costs, labour hours, and estimate statuses in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800">
            Generate Report
          </Button>
          <Button className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold gap-1.5 shadow-md">
            <Plus className="w-3.5 h-3.5" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-slate-700/80 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`p-2 rounded-xl border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Projects Table + Summary Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Projects Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-white">Recent Electrical Projects</h3>
              <p className="text-xs text-slate-400">Current job statuses and schedules</p>
            </div>
            <Button variant="ghost" className="text-xs text-amber-400 hover:text-amber-300 gap-1 p-0 h-auto">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                  <th className="py-3 px-3">Project / Client</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-200">{project.title}</div>
                      <div className="text-[11px] text-slate-400">{project.client}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${project.statusColor}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-medium">{project.dueDate}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-200">
                      {project.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Quick Summary & Activity */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-4">Quick Management Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/40 text-left transition-all group">
                <div className="text-amber-400 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-5 h-5 mb-2" />
                </div>
                <div className="text-xs font-semibold text-slate-200">New Estimate</div>
                <div className="text-[10px] text-slate-500">Draft quote</div>
              </button>

              <button className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group">
                <div className="text-emerald-400 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5 mb-2" />
                </div>
                <div className="text-xs font-semibold text-slate-200">Add Payment</div>
                <div className="text-[10px] text-slate-500">Record income</div>
              </button>

              <button className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 text-left transition-all group">
                <div className="text-purple-400 group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 mb-2" />
                </div>
                <div className="text-xs font-semibold text-slate-200">Log Labour</div>
                <div className="text-[10px] text-slate-500">Track electrician hrs</div>
              </button>

              <button className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 text-left transition-all group">
                <div className="text-blue-400 group-hover:scale-110 transition-transform">
                  <FolderKanban className="w-5 h-5 mb-2" />
                </div>
                <div className="text-xs font-semibold text-slate-200">Add Material</div>
                <div className="text-[10px] text-slate-500">Track supplies</div>
              </button>
            </div>
          </div>

          {/* System Status / Health */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-3">System Connection</h3>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Supabase Cloud Service Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
