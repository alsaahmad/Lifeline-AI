import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "citizen" | "volunteer" | "ambulance" | "hospital" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  mobileNumber?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string, role: Role) => Promise<User>;
  register: (role: Role, userData: any) => Promise<User>;
  logout: () => void;
  verifyEmail: (code: string) => Promise<boolean>;
  resetPassword: (email: string, newPassword: string) => Promise<boolean>;
  verificationCodeSent: boolean;
  sendVerificationCode: (email: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);

  // Load session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("aegis_user");
    const savedToken = localStorage.getItem("aegis_token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (emailOrPhone: string, password: string, role: Role): Promise<User> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get all registered users from local mock database or use dummy defaults
    const mockUsersRaw = localStorage.getItem("aegis_mock_users");
    const mockUsers: any[] = mockUsersRaw ? JSON.parse(mockUsersRaw) : [];

    let matchedUser = mockUsers.find(
      (u) =>
        (u.email?.toLowerCase() === emailOrPhone.toLowerCase() || u.mobileNumber === emailOrPhone) &&
        u.role === role
    );

    // Fallback demo accounts — matched by SELECTED ROLE so any portal works
    // even with a generic email. This ensures First Responder, Ambulance,
    // Hospital and Operations Grid portals always have a usable demo login.
    if (!matchedUser) {
      const demosForRole: Record<string, any> = {
        admin: {
          id: "usr-admin",
          email: "admin@aegis.gov.in",
          name: "Grid Command Officer",
          role: "admin",
          mobileNumber: "9999999999",
          isVerified: true,
        },
        citizen: {
          id: "usr-citizen",
          email: "aarav@aegis.org",
          name: "Aarav Sharma",
          role: "citizen",
          mobileNumber: "9876543210",
          isVerified: true,
        },
        hospital: {
          id: "usr-hospital",
          email: "admin@citycare.org",
          name: "City Care Admin",
          role: "hospital",
          mobileNumber: "9876543212",
          isVerified: true,
        },
        volunteer: {
          id: "usr-volunteer",
          email: "volunteer@aegis.org",
          name: "Aarav Sharma (Responder)",
          role: "volunteer",
          mobileNumber: "9876543214",
          isVerified: true,
        },
        ambulance: {
          id: "usr-ambulance",
          email: "driver@aegis.org",
          name: "Vivaan Sharma",
          role: "ambulance",
          mobileNumber: "9876543216",
          isVerified: true,
        },
      };
      // Use the demo account for whichever role was selected
      matchedUser = demosForRole[role] ?? null;
    }

    if (!matchedUser) {
      setIsLoading(false);
      throw new Error("Invalid credentials or role mismatch. Please register first.");
    }

    if (matchedUser && matchedUser.password) {
      const isOtp = /^\d{6}$/.test(password);
      if (!isOtp && matchedUser.password !== password) {
        setIsLoading(false);
        throw new Error("Incorrect password. Please try again.");
      }
      if (isOtp && password !== "123456") {
        setIsLoading(false);
        throw new Error("Invalid verification code. Use '123456' for testing.");
      }
    }

    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify(matchedUser));

    localStorage.setItem("aegis_user", JSON.stringify(matchedUser));
    localStorage.setItem("aegis_token", mockToken);

    setUser(matchedUser);
    setToken(mockToken);
    setIsLoading(false);

    return matchedUser;
  };

  const register = async (role: Role, userData: any): Promise<User> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockUsersRaw = localStorage.getItem("aegis_mock_users");
    const mockUsers: any[] = mockUsersRaw ? JSON.parse(mockUsersRaw) : [];

    const existingUser = mockUsers.find(
      (u) =>
        u.role === role &&
        (u.email?.toLowerCase() === userData.email?.toLowerCase() ||
          u.mobileNumber === userData.mobileNumber)
    );

    if (existingUser) {
      setIsLoading(false);
      throw new Error("User with this email or mobile number already exists for this role.");
    }

    const newUser: User = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      name: userData.fullName || userData.operatorName || userData.hospitalName || userData.officerName,
      role: role,
      mobileNumber: userData.mobileNumber,
      isVerified: false,
    };

    mockUsers.push({ ...newUser, password: userData.password, fullData: userData });
    localStorage.setItem("aegis_mock_users", JSON.stringify(mockUsers));

    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify(newUser));

    localStorage.setItem("aegis_user", JSON.stringify(newUser));
    localStorage.setItem("aegis_token", mockToken);

    setUser(newUser);
    setToken(mockToken);
    setIsLoading(false);

    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("aegis_user");
    localStorage.removeItem("aegis_token");
    setUser(null);
    setToken(null);
  };

  const sendVerificationCode = async (email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setVerificationCodeSent(true);
    return true;
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (code === "123456" || code.length === 6) {
      if (user) {
        const verifiedUser = { ...user, isVerified: true };
        localStorage.setItem("aegis_user", JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      }
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    throw new Error("Invalid verification code. Use '123456' for testing.");
  };

  const resetPassword = async (email: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const mockUsersRaw = localStorage.getItem("aegis_mock_users");
    const mockUsers: any[] = mockUsersRaw ? JSON.parse(mockUsersRaw) : [];

    const userIndex = mockUsers.findIndex((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (userIndex !== -1) {
      mockUsers[userIndex].password = newPassword;
      localStorage.setItem("aegis_mock_users", JSON.stringify(mockUsers));
    }
    
    setIsLoading(false);
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        resetPassword,
        verificationCodeSent,
        sendVerificationCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
