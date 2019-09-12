import { OPEN_MODAL, CLOSE_MODAL } from "./actionTypes";

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