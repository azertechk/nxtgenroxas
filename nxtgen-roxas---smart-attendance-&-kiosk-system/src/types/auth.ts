export type UserRole = 'admin' | 'volunteer';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  status?: 'approved' | 'pending' | 'rejected';
  avatarUrl: string;
  title: string;
  assignedRoom?: string;
  phone?: string;
  dgroupLeaderName?: string;
  dgroupLeaderPhone?: string;
  registeredAt?: string;
}

export const PRESET_ACCOUNTS: UserAccount[] = [
  {
    id: 'admin-arjay',
    name: 'Arjay Aguirre',
    email: 'arjay.aguirre@hercorcollege.edu.ph',
    username: 'arjay.aguirre',
    password: 'password123',
    role: 'admin',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'Ministry Coordinator & System Admin',
    assignedRoom: 'All Rooms',
    phone: '+63 917 555 1001',
    registeredAt: '2026-01-01',
  },
  {
    id: 'vol-maria',
    name: 'Teacher Maria Santos',
    email: 'maria.santos@nxtgen.church',
    username: 'maria.santos',
    password: 'password123',
    role: 'volunteer',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    title: 'Lead Teacher - Level 1 (Ages 4-5)',
    assignedRoom: 'Level 1',
    phone: '+63 917 555 2002',
    registeredAt: '2026-02-10',
  },
  {
    id: 'vol-john',
    name: 'Teacher John Doe',
    email: 'john.doe@nxtgen.church',
    username: 'john.doe',
    password: 'password123',
    role: 'volunteer',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Assistant Teacher - Level 2 (Ages 6-7)',
    assignedRoom: 'Level 2',
    phone: '+63 917 555 3003',
    registeredAt: '2026-02-15',
  },
  {
    id: 'vol-kyle',
    name: 'Teacher Kyle B.',
    email: 'kyle.b@nxtgen.church',
    username: 'kyle.b',
    password: 'password123',
    role: 'volunteer',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    title: 'Aquarium Room / Tot\'s Place Caregiver',
    assignedRoom: 'Aquarium Room',
    phone: '+63 917 555 4004',
    registeredAt: '2026-03-01',
  },
];
