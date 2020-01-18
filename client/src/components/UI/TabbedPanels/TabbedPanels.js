import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

export default class TabbedPanels extends Component {
	render() {
		let selectedIdx = 0;

		let urlParams = new URLSearchParams(window.location.search);
		let tabId = urlParams.get('tabId') || this.props.selectedTabId; //Prioritise query param
		if(tabId) {
			let selectedTab = this.props.tabs.find(tab => tab.tabId === tabId);
			selectedIdx = selectedTab
				? this.props.tabs.indexOf(selectedTab)
				: 0;
		}

		return <Tabs className="tabbed-panels" defaultIndex={selectedIdx}>
			<TabList className={`tabbed-panels-tabs ${this.props.tabs.length > 1 ? '' : 'hidden'}`}>
				{this.props.tabs.map((tab, idx) => <Tab key={idx} className="tabbed-panels-tab"><h5 className="tab-title">{tab.title}</h5></Tab>)}
			</TabList>
			{this.props.tabs.map((tab, idx) => <TabPanel key={idx} className="tabbed-panels-panel">{tab.content}</TabPanel>)}
		</Tabs>
	}
}