import { api } from "./api";

const basePath = "/cashier";

export type CashierPinStatus = {
  pin_set: boolean;
  unlocked: boolean;
};

export async function cashierUnlockStatus(): Promise<CashierPinStatus> {
  const { data } = await api.get<CashierPinStatus>(`${basePath}/unlock-status`);
  return data;
}

export async function cashierUnlock(pin: string) {
  const { data } = await api.post(`${basePath}/unlock`, { pin });
  return data;
}

export async function cashierLock() {
  const { data } = await api.post(`${basePath}/lock`);
  return data;
}

export async function cashierSetPin(pin: string) {
  const { data } = await api.post(`${basePath}/pin`, { pin });
  return data;
}
