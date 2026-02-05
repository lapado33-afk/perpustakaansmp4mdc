
import { Book, Member, MemberType, Loan, LoanStatus } from './types';

export const APP_NAME = "E-Pustaka SMPN 4 Mappedeceng";
export const FINE_PER_DAY = 500; // Rp 500 per day

export const INITIAL_BOOKS: Book[] = [
  { id: '1', code: 'B001', title: 'Laskar Pelangi', author: 'Andrea Hirata', publisher: 'Bentang Pustaka', year: 2005, category: 'Fiksi', count: 5, available: 4 },
  { id: '2', code: 'B002', title: 'IPA Terpadu Kelas 8', author: 'Tim Abdi Guru', publisher: 'Erlangga', year: 2021, category: 'Sains', count: 40, available: 40 },
  { id: '3', code: 'B003', title: 'Matematika Mahir', author: 'Sutrisno', publisher: 'Yudhistira', year: 2020, category: 'Matematika', count: 35, available: 32 },
  { id: '4', code: 'B004', title: 'Bumi', author: 'Tere Liye', publisher: 'Gramedia', year: 2014, category: 'Fiksi', count: 10, available: 9 }
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 'M001', nomorInduk: '12345', name: 'Budi Santoso', className: '8-A', type: MemberType.SISWA },
  { id: 'M002', nomorInduk: '12346', name: 'Siti Aminah', className: '9-B', type: MemberType.SISWA },
  { id: 'M003', nomorInduk: '19800101', name: 'Bp. Ahmad', className: 'Guru Mapel', type: MemberType.GURU }
];

export const INITIAL_LOANS: Loan[] = [
  { 
    id: 'L001', 
    memberId: 'M001', 
    memberName: 'Budi Santoso', 
    bookId: '1', 
    bookTitle: 'Laskar Pelangi', 
    loanDate: '2023-10-01', 
    dueDate: '2023-10-08', 
    status: LoanStatus.DIPINJAM, 
    fine: 0 
  }
];
