export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  userId?: number;
  id?: number;
  name?: string;
  email: string;
  role: Role;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  businessName?: string | null;
  gstNumber?: string | null;
  customerType: CustomerType;
  address?: string | null;
  status: CustomerStatus;
  followUpDate?: string | null;
  createdAt: string;
  notes?: FollowUpNote[];
  challans?: { id: number; challanNumber: string; status: string; totalQuantity: number }[];
}

export interface FollowUpNote {
  id: number;
  note: string;
  createdAt: string;
  createdBy?: { id: number; name: string };
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category?: string | null;
  unitPrice: string | number;
  currentStock: number;
  minStockAlert: number;
  location?: string | null;
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: number;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdAt: string;
  createdBy?: { id: number; name: string };
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ChallanItem {
  id: number;
  productId: number;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  unitPriceSnapshot: string | number;
  quantity: number;
}

export interface Challan {
  id: number;
  challanNumber: string;
  customerId: number;
  totalQuantity: number;
  status: ChallanStatus;
  createdAt: string;
  customer?: Customer;
  items: ChallanItem[];
}

export interface Paginated<T> {
  success: boolean;
  pagination: { total: number; page: number; limit: number; totalPages: number };
  [key: string]: any;
}
