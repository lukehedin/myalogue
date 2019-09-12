import { OPEN_MODAL, CLOSE_MODAL } from "../actionTypes";

const initialState = {
  modals: []
};

export default function(state = initialState, action) {
	switch (action.type) {
		case OPEN_MODAL: {
			const modal = action.payload;
			return {
				...state,
				modals: [...state.modals, modal]
			};
		}
    	case CLOSE_MODAL: {
			const modalId = action.payload;
    		return {
				...state,
				modals: modalId // If no id supplied, just close the last (topmost) one
					? state.modals.filter(modal => modal.modalId !== modalId)
					: state.modals.filter((modal, idx) => idx !== state.modals.length - 1)
    		};
		}
    	default:
    		return state;
	}
}
