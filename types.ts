
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum MemberType {
  SISWA = 'Siswa',
  GURU = 'Guru'
}

export enum LoanStatus {
  DIPINJAM = 'Dipinjam',
  KEMBALI = 'Kembali',
  TERLAMBAT = 'Terlambat'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
}

export interface Book {
  id: string;
  code: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  category: string;
  count: number;
  available: number;
}

export interface Member {
  id: string;
  nomorInduk: string;
  name: string;
  className: string;
  type: MemberType;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  bookId: string;
  bookTitle: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
  fine: number;
}

export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  totalMembers: number;
}
