export default interface IDbTemplatePanel {
	TemplatePanelId: number
	SizeX: number
	SizeY: number
	PositionX: number
	PositionY: number
	Image: string
	ImageColour: string
	TextAlignVertical?: number //1.(null)bottom, 2.top, 3.middle
	TextAlignHorizontal?: number //1.(null)middle, 2.left, 3.right
	TextColour?: number //1.(null)black, 2. white
	Ordinal?: number //optional
	Description: string

	//Occurance controls (not needed by mapper, just play logic)
	IsNeverLast: boolean
	IsNeverFirst: boolean
	IsOnlyLast: boolean //Implies IsNeverFirst
	IsOnlyFirst: boolean //Implies IsNeverLast
	IsNeverRepeat: boolean
	PanelGroup?: number //Used to create preferential/avoidance etc behaviour with other panels
	PanelGroupBehaviour?: number //1.(null)prefer, 2.avoid 
	AtOrAfterQuartile?: number // 1, 2, 3, 4 (1 is kinda useless)
	AtOrBeforeQuartile?: number // 1, 2, 3, 4 (4 is kinda useless)
}