import IDbTemplatePanel from './IDbTemplatePanel';

export default interface IDbTemplate {
	TemplateId: number
	UnlockedAt: Date
	Name: string
	Ordinal: number
	MaxPanelCount: number
	MinPanelCount: number
	TemplatePanels: IDbTemplatePanel[]
}