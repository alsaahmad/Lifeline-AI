export type Profile = Record<string, any>;

const PREFIX = "aegis-profile:";

function getUserId(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const rawUser = localStorage.getItem("aegis_user");
    if (!rawUser) return null;
    const user = JSON.parse(rawUser);
    return user.id || null;
  } catch (e) {
    return null;
  }
}

function migrateLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;

  const migrations: Record<string, string> = {
    "lifeline-user": "aegis-user",
    "lifeline-profile": "aegis-profile",
    "lifeline-auth": "aegis-auth",
    "auth": "aegis-auth",
  };

  Object.entries(migrations).forEach(([oldKey, newKey]) => {
    const val = localStorage.getItem(oldKey);
    if (val !== null) {
      localStorage.setItem(newKey, val);
      localStorage.removeItem(oldKey);
    }
  });
}

// Run migration immediately
migrateLocalStorage();

function normalizeProfile(role: string, profile: Profile): Profile {
  if (!profile) return {};
  
  // Extract and normalize name values
  const nameVal = 
    profile.fullName || 
    profile.driverName || 
    profile.hospitalName || 
    profile.officerName || 
    profile.operatorName || 
    profile.name || 
    "";
  profile.name = nameVal;
  
  // Extract and normalize phone values
  const phoneVal = 
    profile.mobileNumber || 
    profile.emergencyNumber || 
    profile.phone || 
    "";
  profile.phone = phoneVal;

  // Sync role-specific fields
  if (role === "citizen" || role === "volunteer") {
    profile.fullName = nameVal;
    profile.mobileNumber = phoneVal;
  } else if (role === "ambulance") {
    profile.driverName = nameVal;
    profile.operatorName = nameVal;
    profile.mobileNumber = phoneVal;
  } else if (role === "hospital") {
    profile.hospitalName = nameVal;
    profile.emergencyNumber = phoneVal;
  } else if (role === "admin") {
    profile.officerName = nameVal;
    profile.mobileNumber = phoneVal;
  }

  // Handle citizen specific medical fields mapping
  if (role === "citizen") {
    profile.conditions = profile.conditions || profile.medicalConditions || "";
    profile.medicalConditions = profile.conditions;
    if (!profile.emergencyContacts && profile.emergencyName) {
      profile.emergencyContacts = `${profile.emergencyName} (${profile.emergencyRelationship || ""}) - ${profile.emergencyNumber || ""}`;
    }
  }
  
  return profile;
}

export function getProfile(role: string): Profile {
  try {
    const userId = getUserId();
    const key = userId ? `${PREFIX}${userId}` : `${PREFIX}${role}`;
    const raw = localStorage.getItem(key);
    
    if (!raw) {
      // Fallback: Populate details from the currently logged-in user session
      const rawUser = localStorage.getItem("aegis_user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.role === role || (role === "admin" && user.role === "admin")) {
          // Check if there is detailed registration data saved in mock users database
          const mockUsersRaw = localStorage.getItem("aegis_mock_users");
          if (mockUsersRaw) {
            const mockUsers = JSON.parse(mockUsersRaw);
            const foundUser = mockUsers.find((u: any) => u.id === user.id);
            if (foundUser && foundUser.fullData) {
              const fallbackProfile = {
                name: foundUser.name || "",
                email: foundUser.email || "",
                phone: foundUser.mobileNumber || "",
                ...foundUser.fullData,
              };
              return normalizeProfile(role, fallbackProfile);
            }
          }
          
          const fallbackProfile = {
            name: user.name || "",
            email: user.email || "",
            phone: user.mobileNumber || "",
          };
          return normalizeProfile(role, fallbackProfile);
        }
      }
      return {};
    }
    return normalizeProfile(role, JSON.parse(raw));
  } catch (e) {
    return {};
  }
}

export function saveProfile(role: string, data: Profile) {
  try {
    const userId = getUserId();
    const key = userId ? `${PREFIX}${userId}` : `${PREFIX}${role}`;
    
    // Retrieve the existing profile to merge updates and prevent loss of other fields
    const existing = getProfile(role);
    const merged = { ...existing, ...data };
    
    // Normalize fields before writing
    const normalized = normalizeProfile(role, merged);
    localStorage.setItem(key, JSON.stringify(normalized));
    
    // Proactively update the current logged-in user session details
    const rawUser = localStorage.getItem("aegis_user");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.id === userId) {
        user.name = normalized.name || user.name;
        user.email = normalized.email || user.email;
        user.mobileNumber = normalized.phone || user.mobileNumber;
        localStorage.setItem("aegis_user", JSON.stringify(user));
        
        // Also update in the mock users database
        const mockUsersRaw = localStorage.getItem("aegis_mock_users");
        if (mockUsersRaw) {
          const mockUsers = JSON.parse(mockUsersRaw);
          const idx = mockUsers.findIndex((u: any) => u.id === userId);
          if (idx !== -1) {
            mockUsers[idx].name = normalized.name || mockUsers[idx].name;
            mockUsers[idx].email = normalized.email || mockUsers[idx].email;
            mockUsers[idx].mobileNumber = normalized.phone || mockUsers[idx].mobileNumber;
            mockUsers[idx].fullData = { ...mockUsers[idx].fullData, ...normalized };
            localStorage.setItem("aegis_mock_users", JSON.stringify(mockUsers));
          }
        }
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function clearSession() {
  try {
    // Keep user profiles persisted on the device so users can log back in.
    // Do not clear the aegis-profile:* keys.
    // Session state clearing is handled separately by removing the active user token.
  } catch (e) {
    // ignore
  }
}
