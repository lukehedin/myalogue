import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

export default class TabbedPanels extends Component {
	render() {
		return <Tabs className="tabbed-panels">
			<TabList className="tabbed-panels-tabs">
				{this.props.tabs.map((tab, idx) => <Tab key={idx} className="tabbed-panels-tab"><h5 className="tab-title">{tab.title}</h5></Tab>)}
			</TabList>
			{this.props.tabs.map((tab, idx) => <TabPanel key={idx} className="tabbed-panels-panel">{tab.content}</TabPanel>)}
		</Tabs>
	}
}