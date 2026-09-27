export type Frequency =
  | "once"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "trimonthly"
  | "yearly";

export type Task = {
  id: string;
  title: string;
  tags: string[];
  frequency: Frequency;
  completed: boolean;
  createdAt: number;
  deadline?: number | null;
  count?: number;
  progress?: number;
};

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "trimonthly", label: "Trimonthly" },
  { value: "yearly", label: "Yearly" },
];
