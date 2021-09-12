export default interface ITemplatePanel {
	templatePanelId: number,
	ordinal: number,
	positionX: number,
	positionY: number,
	sizeX: number,
	sizeY: number,
	image: string,
	imageColour: string,
	textAlignVertical?: number,
	textAlignHorizontal?: number,
	textColour?: number
}