import React, { createContext, ReactNode, useContext, useState } from "react";
import ErrorModal from "./ErrorModal";
import SuccessModal from "./SuccessModal";

interface ModalContextType {
  showSuccess: (title: string, message: string, buttonText?: string, onButtonPress?: () => void) => void;
  showError: (title: string, message: string, buttonText?: string, onButtonPress?: () => void) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = (): ModalContextType => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within a ModalProvider");
  return ctx;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [successState, setSuccessState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttonText?: string;
    onButtonPress?: () => void;
  }>({ visible: false, title: "", message: "" });

  const [errorState, setErrorState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttonText?: string;
    onButtonPress?: () => void;
  }>({ visible: false, title: "", message: "" });

  const showSuccess = (
    title: string,
    message: string,
    buttonText?: string,
    onButtonPress?: () => void
  ) => {
    setSuccessState({ visible: true, title, message, buttonText, onButtonPress });
  };

  const showError = (
    title: string,
    message: string,
    buttonText?: string,
    onButtonPress?: () => void
  ) => {
    setErrorState({ visible: true, title, message, buttonText, onButtonPress });
  };

  const closeSuccess = () =>
    setSuccessState((s) => ({ ...s, visible: false, onButtonPress: undefined }));
  const closeError = () =>
    setErrorState((e) => ({ ...e, visible: false, onButtonPress: undefined }));

  return (
    <ModalContext.Provider value={{ showSuccess, showError }}>
      {children}
      <SuccessModal
        visible={successState.visible}
        title={successState.title}
        message={successState.message}
        buttonText={successState.buttonText}
        onClose={closeSuccess}
        onButtonPress={successState.onButtonPress}
      />
      <ErrorModal
        visible={errorState.visible}
        title={errorState.title}
        message={errorState.message}
        buttonText={errorState.buttonText}
        onClose={closeError}
        onButtonPress={errorState.onButtonPress}
      />
    </ModalContext.Provider>
  );
};
