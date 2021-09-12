import ITemplatePanel from "./ITemplatePanel";

export default interface ITemplate {
	templateId: number
	name: string
	unlockedAt: Date
	templatePanels: ITemplatePanel[]
}