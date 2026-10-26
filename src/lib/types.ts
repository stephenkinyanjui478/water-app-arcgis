/** Shared response shapes from the backend API. */

export interface Meter {
  meterNo: string;
  customerName: string | null;
  dma: string | null;
  tariff: string | null;
  connType: string | null;
  connStatus: string | null;
  outstandingBill: number;
  latestReading: number | null;
  prevReading: number | null;
  connectionDate: number | null;
  accountNo: string | null;
  accountBalance: number | null;
}

export interface Invoice {
  objectId: number;
  invoiceNo: string;
  billingCycle: string;
  consumption: number;
  prevBalance: number;
  billed: number;
  totalPayable: number;
  paid: number;
  balance: number;
  status: string;
  method: string | null;
  invDate: number | null;
  dma: string | null;
}

export interface Payment {
  objectId: number;
  receiptNo: string;
  payType: string;
  method: string;
  amount: number;
  payDate: number | null;
  billingCycle: string;
  narration: string;
}

export interface ConsumptionPoint {
  billingCycle: string;
  consumption: number;
  currentReading: number | null;
  prevReading: number | null;
  readingDate: number | null;
  readingStatus: string;
}
export interface ConsumptionResponse {
  points: ConsumptionPoint[];
  summary: { count: number; total: number; average: number; latest: number; peak: number };
}

export interface Incidence {
  objectId: number;
  incidentNo: string;
  type: string;
  description: string;
  reportedDate: number | null;
  meterNo: string | null;
  status: string;
  priority: string;
  assignee: string | null;
  dueDate: number | null;
  completedDate: number | null;
}

export interface IncidenceType {
  name: string;
  description: string | null;
  defaultPriority: number | null;
}

export interface Support {
  utility: string;
  callCentre: string;
  emergencyLine: string;
  whatsapp: string;
  email: string;
  hours: string;
  address: string;
  payBill: string;
}

export interface WorkerVerify {
  verified: boolean;
  message: string;
  worker?: {
    code: string;
    name: string;
    role: string;
    dma: string;
    active: boolean;
    capabilities: string[];
  };
}
