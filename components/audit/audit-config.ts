import {
  UserPlus,
  UserMinus,
  FileCheck,
  FileX,
  FileUp,
  Settings,
  History,
  ShieldCheck,
  Target,
  CheckCircle,
} from 'lucide-react'

export type ActionConfig = {
  icon: React.ElementType
  color: string
  label: string
}

export const ACTION_CONFIG_MAP: Record<string, ActionConfig> = {
  request_submitted:   { icon: FileUp,      color: 'text-blue-500 bg-blue-50 border-blue-100', label: 'Draft Submitted' },
  hod_approved:        { icon: FileCheck,   color: 'text-emerald-500 bg-emerald-50 border-emerald-100', label: 'HOD Approved' },
  approval_approved:   { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'DT Approved' },
  admin_approved:      { icon: CheckCircle, color: 'text-emerald-700 bg-emerald-50 border-emerald-100', label: 'Admin Approved' },
  super_admin_approved:{ icon: CheckCircle, color: 'text-emerald-800 bg-emerald-50 border-emerald-100', label: 'System Approved' },
  hod_rejected:        { icon: FileX,       color: 'text-red-500 bg-red-50 border-red-100', label: 'HOD Rejected' },
  approval_rejected:   { icon: FileX,       color: 'text-red-500 bg-red-50 border-red-100', label: 'Director Rejected' },
  admin_rejected:      { icon: FileX,       color: 'text-red-500 bg-red-50 border-red-100', label: 'Admin Rejected' },
  super_admin_rejected:{ icon: FileX,       color: 'text-red-500 bg-red-50 border-red-100', label: 'Super Admin Rejected' },
  user_created:        { icon: UserPlus,    color: 'text-indigo-500 bg-indigo-50 border-indigo-100', label: 'User Provisioned' },
  user_removed:        { icon: UserMinus,   color: 'text-orange-500 bg-orange-50 border-orange-100', label: 'User Deactivated' },
  user_role_updated:   { icon: Settings,    color: 'text-amber-500 bg-amber-50 border-amber-100', label: 'Security Access Updated' },
  user_department_updated: { icon: Target,  color: 'text-violet-500 bg-violet-50 border-violet-100', label: 'Unit Assignment Modified' },
  ucd_status_changed_to_sprint: { icon: Target, color: 'text-violet-500 bg-violet-50 border-violet-100', label: 'UCD Moved to Sprint' },
  ucd_status_changed_to_uat: { icon: Target, color: 'text-indigo-500 bg-indigo-50 border-indigo-100', label: 'UCD Moved to UAT' },
  ucd_status_changed_to_completed: { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', label: 'UCD Completed' },
}

export const DEFAULT_ACTION_CONFIG: ActionConfig = { 
  icon: History, 
  color: 'text-slate-400 bg-slate-50 border-slate-100', 
  label: 'System Action' 
}
