export interface User {
    _id: string;
    handle: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    region: string;
    profilePicture?: string;
    createdAt: string;
    updatedAt: string;
}
  
export interface AuthUser extends User {
    token: string;
}
  
export interface LoginCredentials {
    email: string;
    password: string;
}
  
export interface RegisterData {
    handle: string;
    name: string;
    email: string;
    password: string;
    region: string;
}