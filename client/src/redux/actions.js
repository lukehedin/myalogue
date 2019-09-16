import { OPEN_MODAL, CLOSE_MODAL, CLOSE_ALL_MODALS } from "./actionTypes";

let nextModalId = 0;

export const openModal = modal => ({
  type: OPEN_MODAL,
  payload: {
    modalId: ++nextModalId,
    ...modal
  }
});

export const closeModal = modalId => ({
	type: CLOSE_MODAL,
	payload: modalId
});

export const closeAllModals = () => ({
	type: CLOSE_ALL_MODALS
});