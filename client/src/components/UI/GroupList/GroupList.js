import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import HTMLEllipsis from 'react-lines-ellipsis/lib/html';
import Util from '../../../Util';
import Button from '../Button/Button';

export default class GroupList extends Component {
	render() {
		return <div className="group-list">
			{Util.array.any(this.props.groups)
				? this.props.groups.map(group => {
					return <div key={group.groupId} className="group-list-item">
						<Link to={Util.route.group(group.groupId)}><p>{group.name}</p></Link>
						{group.description
							? <HTMLEllipsis
								className="description"
								unsafeHTML={Util.format.userStringToSafeHtml(group.description)}
								maxLine='3'
								ellipsis='...'
								basedOn='letters'
							/>
							: null
						}
						<p className="sm">{group.groupUsers.length} {Util.format.pluralise(group.groupUsers, 'member')}</p>
						{Util.context.isInGroup(group.groupId)
							? null
							: <Button label="Request to join" />
						}
					</div>
				})
				: <p className="empty-text">No groups found.</p>
			}
		</div>
	}
}