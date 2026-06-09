export type ActionStatus =
  | "NOW" | "PRIORITY" | "QUEUE" | "SCHEDULED" | "WAITING_FOR"
  | "SOMEDAY_MAYBE" | "REVIEW" | "PROBLEM" | "DELEGATE"
  | "TENTATIVE" | "ARCHIVE" | "REMINDER" | "ONGOING" | "SCRAPPED" | "SNOOZED";

// Airtable label → our enum
export const AIRTABLE_STATUS_MAP: Record<string, ActionStatus> = {
  "NOW":          "NOW",
  "Priority":     "PRIORITY",
  "Queue":        "QUEUE",
  "Scheduled":    "SCHEDULED",
  "Waiting For":  "WAITING_FOR",
  "Smdy/Maybe":   "SOMEDAY_MAYBE",
  "Review":       "REVIEW",
  "Problem":      "PROBLEM",
  "Delegate":     "DELEGATE",
  "Tentative":    "TENTATIVE",
  "Archive":      "ARCHIVE",
  "Reminder":     "REMINDER",
  "Ongoing":      "ONGOING",
  "Scrapped":     "SCRAPPED",
  "Snoozed":      "SNOOZED",
  "STATUS":       "REVIEW",
};

// Our enum → Airtable label (for writes)
export const STATUS_TO_AIRTABLE: Record<ActionStatus, string> = {
  NOW:          "NOW",
  PRIORITY:     "Priority",
  QUEUE:        "Queue",
  SCHEDULED:    "Scheduled",
  WAITING_FOR:  "Waiting For",
  SOMEDAY_MAYBE:"Smdy/Maybe",
  REVIEW:       "Review",
  PROBLEM:      "Problem",
  DELEGATE:     "Delegate",
  TENTATIVE:    "Tentative",
  ARCHIVE:      "Archive",
  REMINDER:     "Reminder",
  ONGOING:      "Ongoing",
  SCRAPPED:     "Scrapped",
  SNOOZED:      "Snoozed",
};

export const STATUS_CONFIG: Record<ActionStatus,{label:string;color:string;bg:string;dot:string;ring:string}> = {
  NOW:          { label:"NOW",          color:"text-emerald-700 dark:text-emerald-400",  bg:"bg-emerald-50 dark:bg-emerald-950/40",  dot:"bg-emerald-500",   ring:"ring-emerald-300" },
  PRIORITY:     { label:"Priority",     color:"text-amber-700 dark:text-amber-400",      bg:"bg-amber-50 dark:bg-amber-950/40",      dot:"bg-amber-500",     ring:"ring-amber-300" },
  QUEUE:        { label:"Queue",        color:"text-blue-700 dark:text-blue-400",        bg:"bg-blue-50 dark:bg-blue-950/40",        dot:"bg-blue-500",      ring:"ring-blue-300" },
  SCHEDULED:    { label:"Scheduled",    color:"text-cyan-700 dark:text-cyan-400",        bg:"bg-cyan-50 dark:bg-cyan-950/40",        dot:"bg-cyan-500",      ring:"ring-cyan-300" },
  WAITING_FOR:  { label:"Waiting For",  color:"text-orange-700 dark:text-orange-400",    bg:"bg-orange-50 dark:bg-orange-950/40",    dot:"bg-orange-500",    ring:"ring-orange-300" },
  SOMEDAY_MAYBE:{ label:"Someday",      color:"text-purple-700 dark:text-purple-400",    bg:"bg-purple-50 dark:bg-purple-950/40",    dot:"bg-purple-500",    ring:"ring-purple-300" },
  REVIEW:       { label:"Review",       color:"text-slate-600 dark:text-slate-300",      bg:"bg-slate-100 dark:bg-slate-800/60",     dot:"bg-slate-500",     ring:"ring-slate-300" },
  PROBLEM:      { label:"Problem",      color:"text-red-700 dark:text-red-400",          bg:"bg-red-50 dark:bg-red-950/40",          dot:"bg-red-500",       ring:"ring-red-300" },
  DELEGATE:     { label:"Delegate",     color:"text-violet-700 dark:text-violet-400",    bg:"bg-violet-50 dark:bg-violet-950/40",    dot:"bg-violet-500",    ring:"ring-violet-300" },
  TENTATIVE:    { label:"Tentative",    color:"text-orange-600 dark:text-orange-300",    bg:"bg-orange-50/60 dark:bg-orange-950/20", dot:"bg-orange-400",    ring:"ring-orange-200" },
  ARCHIVE:      { label:"Archive",      color:"text-slate-400 dark:text-slate-500",      bg:"bg-slate-50 dark:bg-slate-900/40",      dot:"bg-slate-300",     ring:"ring-slate-200" },
  REMINDER:     { label:"Reminder",     color:"text-pink-700 dark:text-pink-400",        bg:"bg-pink-50 dark:bg-pink-950/40",        dot:"bg-pink-500",      ring:"ring-pink-300" },
  ONGOING:      { label:"Ongoing",      color:"text-blue-600 dark:text-blue-300",        bg:"bg-blue-50/60 dark:bg-blue-950/20",     dot:"bg-blue-400",      ring:"ring-blue-200" },
  SCRAPPED:     { label:"Scrapped",     color:"text-slate-400 dark:text-slate-500",      bg:"bg-slate-50 dark:bg-slate-900/30",      dot:"bg-slate-300",     ring:"ring-slate-200" },
  SNOOZED:      { label:"Snoozed",      color:"text-teal-700 dark:text-teal-400",        bg:"bg-teal-50 dark:bg-teal-950/40",        dot:"bg-teal-500",      ring:"ring-teal-300" },
};

export const ALL_STATUSES = Object.keys(STATUS_CONFIG) as ActionStatus[];

export const ACTION_TYPES = [
  "Tasking","Sourcing","Email","Meeting","Phone","Research","Development",
  "Outcome","Planning","Decision","Movement","Touring","Maintenance","Legal",
  "Training","Product","RFQ","Notice","Conf Call","Wrap","Ad Campaign",
  "Refurb","Mech","Property","Workticket","Role","Template","In Transit",
];

export const CONTEXT_TAGS = [
  "Austin","Branford","Iloilo","Saipan","Travel","Phone","Online",
  "Errand","Financial","Legal","Seasonal","Happy Human","Happy Mind",
  "Happy Living","House OS","Ramin",
];

export const TYPE_COLORS: Record<string,string> = {
  Tasking:     "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Sourcing:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300",
  Email:       "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  Meeting:     "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Phone:       "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  Research:    "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300",
  Development: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  Outcome:     "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300",
  Planning:    "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
  Decision:    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  Legal:       "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Training:    "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  Movement:    "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
};
