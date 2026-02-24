import { api } from './api';
import { Bill, CardTransaction, Asset } from '../types';

export interface BillDTO {
  id: number;
  userId: number;
  billType: string;
  billDate: string;
  billName: string;
  billValue: number;
  billDescription: string;
  billTable: 'MAIN' | 'CREDIT_CARD' | 'PAYMENT_CARD' | 'ASSETS';
  billCategory: string;
  paid: boolean;
  isInstallment: boolean;
  installmentCount: number;
  currentInstallment: number;
  entryMethod: 'MANUAL' | 'AUDIO' | 'AI_DOCUMENT';
  isRecurrent: boolean;
  paymentType?: string;
}

const mapDTOToBill = (dto: BillDTO | undefined, fallback?: Partial<Bill>): Bill => ({
  id: (dto && dto.id !== undefined && dto.id !== null)
    ? dto.id.toString()
    : (fallback?.id ?? Math.random().toString(36).slice(2,9)),
  amount: dto?.billValue ?? fallback?.amount ?? 0,
  description: dto?.billName ?? fallback?.description ?? '',
  date: dto?.billDate ?? fallback?.date ?? new Date().toISOString().split('T')[0],
  isPaid: dto?.paid ?? fallback?.isPaid ?? false,
  category: dto?.billCategory ?? fallback?.category ?? 'Others',
});

const mapBillToDTO = (bill: any, existing?: BillDTO, table: 'MAIN' | 'CREDIT_CARD' | 'ASSETS' = 'MAIN', type: 'INCOME' | 'EXPENSE' = 'EXPENSE'): Partial<BillDTO> => {
  const formattedDate = bill.date ? bill.date.split('T')[0] : existing?.billDate || new Date().toISOString().split('T')[0];
  return {
    ...existing,
    billName: bill.description || existing?.billName,
    billValue: bill.amount || existing?.billValue,
    billDate: formattedDate,
    billCategory: bill.category || existing?.billCategory || 'Others',
    paid: bill.isPaid !== undefined ? bill.isPaid : existing?.paid,
    billTable: table as any,
    billType: type,
    entryMethod: 'MANUAL',
    isInstallment: bill.isInstallment ?? existing?.isInstallment ?? false,
    isRecurrent: bill.isRecurrent ?? existing?.isRecurrent ?? false,
    installmentCount: bill.installmentCount ?? existing?.installmentCount ?? 0,
    currentInstallment: 1,
  };
};

export const billService = {
  getBills: async (date: string): Promise<Bill[]> => {
    const [year, month] = date.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedDate = `${months[parseInt(month, 10) - 1]}${year}`;

    const dtos = await api.get<BillDTO[]>(`/bill/load-main-table-data?billDate=${formattedDate}`);
    return dtos.map(d => mapDTOToBill(d));
  },

  getCardBills: async (date: string): Promise<CardTransaction[]> => {
    const [year, month] = date.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedDate = `${months[parseInt(month, 10) - 1]}${year}`;

    const dtos = await api.get<BillDTO[]>(`/bill/load-card-table-data?billDate=${formattedDate}`);
    return dtos.map(d => ({
      id: d.id?.toString() ?? Math.random().toString(36).slice(2,9),
      amount: Number(d.billValue ?? 0),
      description: d.billName ?? '',
      date: d.billDate ?? formattedDate,
      category: d.billCategory ?? 'others',
      cardId: d.paymentType ? String(d.paymentType) : '',
      installments: d.currentInstallment !== undefined && d.installmentCount !== undefined ? { current: d.currentInstallment ?? 0, total: d.installmentCount ?? 0 } : undefined
    } as CardTransaction));
  },

  getAssetsBills: async (date: string): Promise<Asset[]> => {
    const [year, month] = date.split('-');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedDate = `${months[parseInt(month, 10) - 1]}${year}`;

    const dtos = await api.get<BillDTO[]>(`/bill/load-assets-table-data?billDate=${formattedDate}`);
    return dtos.map(d => ({
      id: d.id?.toString() ?? Math.random().toString(36).slice(2,9),
      amount: Number(d.billValue ?? 0),
      description: d.billName ?? '',
      date: d.billDate ?? formattedDate,
      type: 'other'
    } as Asset));
  },
  
  createBill: async (bill: any, table: 'MAIN' | 'CREDIT_CARD' | 'ASSETS' = 'MAIN', type: 'INCOME' | 'EXPENSE' = 'EXPENSE'): Promise<Bill> => {
    const dto = mapBillToDTO(bill, undefined, table, type) as BillDTO;
    const response = await api.post<BillDTO>('/bill/bill-register', { ...dto, id: 0, userId: 0 });
    if (!response || response.id === undefined || response.id === null || isNaN(Number(response.id))) {
      throw new Error('Falha ao criar registro: resposta inválida do backend.');
    }
    return mapDTOToBill(response, bill);
  },
  
  updateBill: async (bill: Bill): Promise<Bill> => {
    const dto = mapBillToDTO(bill) as BillDTO;
    dto.id = parseInt(bill.id);
    const response = await api.put<BillDTO>('/bill/edit', dto);

    if (!response || response.id === undefined || response.id === null) {
      return mapDTOToBill({
        ...dto,
        id: dto.id,
        billValue: dto.billValue,
        billName: dto.billName,
        billDate: dto.billDate,
        billCategory: dto.billCategory,
        paid: dto.paid
      } as BillDTO, { id: bill.id });
    }

    return mapDTOToBill(response);
  },
  
  deleteBill: async (id: string): Promise<void> => {
    await api.delete(`/bill/delete?itemId=${id}`);
  },

  batchRegister: async (bills: Partial<BillDTO>[]): Promise<void> => {
    await api.post('/bill/batch-register', bills);
  }
};
