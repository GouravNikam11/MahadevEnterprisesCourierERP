/** Compile-time Prisma surface used by the app (runtime client loads from generated/prisma). */
export interface PrismaModelDelegate {
  findMany(args?: any): Promise<any[]>
  findFirst(args?: any): Promise<any | null>
  findUniqueOrThrow(args?: any): Promise<any>
  create(args?: any): Promise<any>
  update(args?: any): Promise<any>
  updateMany(args?: any): Promise<any>
  count(args?: any): Promise<number>
  upsert(args?: any): Promise<any>
}

export interface PrismaClient {
  $connect(): Promise<void>
  $disconnect(): Promise<void>
  user: PrismaModelDelegate
  role: PrismaModelDelegate
  refreshToken: PrismaModelDelegate
  passwordResetToken: PrismaModelDelegate
  accountParty: PrismaModelDelegate
  accountBooking: PrismaModelDelegate
  cashBooking: PrismaModelDelegate
  courierCompany: PrismaModelDelegate
  pincode: PrismaModelDelegate
  invoice: PrismaModelDelegate
  invoiceItem: PrismaModelDelegate
  courierStatusLog: PrismaModelDelegate
  smsLog: PrismaModelDelegate
}

