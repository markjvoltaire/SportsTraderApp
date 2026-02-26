import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

const defaultDraft = {
  basicInfo: {
    first_name: "",
    last_name: "",
    dob: "",
    email: "",
    country_of_residence: "USA",
    nationality: "USA",
    tin: "",
  },
  address: {
    street: "",
    city: "",
    state: "",
    postal_code: "",
    country: "USA",
  },
  financialProfile: {
    occupation_id: "",
    source_of_fund_id: "",
    purpose_id: "",
    monthly_volume_usd: "",
  },
  documents: {
    identityType: "PASSPORT",
    identityNumber: "",
    identityCountry: "USA",
    identityIssueDate: "",
    identityExpiryDate: "",
    identityFiles: [],
    addressType: "UTILITY_BILL",
    addressCountry: "USA",
    addressFiles: [],
  },
  phone: {
    e164: "",
    raw: "",
  },
  fin: {
    customerId: null,
    tosPoliciesValue: null,
  },
};

const OnboardingContext = createContext(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

export function OnboardingProvider({ children }) {
  const [draft, setDraft] = useState(defaultDraft);

  const updateBasicInfo = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, ...patch },
    }));
  }, []);

  const updateAddress = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      address: { ...prev.address, ...patch },
    }));
  }, []);

  const updateFinancialProfile = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      financialProfile: { ...prev.financialProfile, ...patch },
    }));
  }, []);

  const updateDocuments = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      documents: { ...prev.documents, ...patch },
    }));
  }, []);

  const updatePhone = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      phone: { ...prev.phone, ...patch },
    }));
  }, []);

  const updateFin = useCallback((patch) => {
    setDraft((prev) => ({
      ...prev,
      fin: { ...prev.fin, ...patch },
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setDraft(defaultDraft);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      updateBasicInfo,
      updateAddress,
      updateFinancialProfile,
      updateDocuments,
      updatePhone,
      updateFin,
      resetOnboarding,
    }),
    [
      draft,
      updateBasicInfo,
      updateAddress,
      updateFinancialProfile,
      updateDocuments,
      updatePhone,
      updateFin,
      resetOnboarding,
    ]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}
