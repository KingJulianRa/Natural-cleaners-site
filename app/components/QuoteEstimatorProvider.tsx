"use client";

import React, { createContext, useContext, useState } from "react";

export type QuoteEstimatorFormState = {
  houseSize: string;
  bathrooms: string;
  bathroomSize: string;
  kitchenSize: string;
  cleanlinessLevel: string;
  serviceLevel: string;
};

const INITIAL_QUOTE_FORM: QuoteEstimatorFormState = {
  houseSize: "",
  bathrooms: "",
  bathroomSize: "",
  kitchenSize: "",
  cleanlinessLevel: "",
  serviceLevel: "",
};

type QuoteEstimatorContextValue = {
  quoteForm: QuoteEstimatorFormState;
  updateQuoteForm: <Field extends keyof QuoteEstimatorFormState>(
    field: Field,
    value: QuoteEstimatorFormState[Field]
  ) => void;
  resetQuoteForm: () => void;
};

const QuoteEstimatorContext = createContext<QuoteEstimatorContextValue | null>(null);

export function QuoteEstimatorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [quoteForm, setQuoteForm] = useState(INITIAL_QUOTE_FORM);

  function updateQuoteForm<Field extends keyof QuoteEstimatorFormState>(
    field: Field,
    value: QuoteEstimatorFormState[Field]
  ) {
    setQuoteForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetQuoteForm() {
    setQuoteForm(INITIAL_QUOTE_FORM);
  }

  return (
    <QuoteEstimatorContext.Provider
      value={{
        quoteForm,
        updateQuoteForm,
        resetQuoteForm,
      }}
    >
      {children}
    </QuoteEstimatorContext.Provider>
  );
}

export function useQuoteEstimator() {
  const context = useContext(QuoteEstimatorContext);

  if (!context) {
    throw new Error("useQuoteEstimator must be used within a QuoteEstimatorProvider.");
  }

  return context;
}
